from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.models.schemas import ErrorResponse, ImageAnalysisResponse
from app.services.conversation_manager import get_conversation_manager
from app.services.image_analyzer import get_analyzer_service
from app.utils.image_validator import ImageValidationError, validate_image_bytes, validate_image_file

router = APIRouter(prefix="/api", tags=["Image Analysis"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    """Verify backend API and model service health."""
    analyzer = get_analyzer_service()
    return {
        "status": "healthy",
        "service": "Conversational Image Recognition Chatbot API",
        "phase": 1,
        "model_loaded": analyzer._model is not None,
    }


@router.post(
    "/analyze-image",
    response_model=ImageAnalysisResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image or validation failed"},
        413: {"model": ErrorResponse, "description": "File size exceeds limit"},
        500: {"model": ErrorResponse, "description": "Internal image processing error"},
    },
    summary="Upload and analyze an image for object detection",
)
async def analyze_image(
    file: Optional[UploadFile] = File(None, description="Image file to analyze"),
    image: Optional[UploadFile] = File(None, description="Alternative form field name for image file"),
    confidence_threshold: Optional[float] = Form(None, description="Optional custom confidence threshold (0.0 to 1.0)"),
):
    """
    Receives an uploaded image, validates format and size, runs object detection,
    and returns detected object labels with confidence scores and coordinates.
    """
    upload = file or image
    if upload is None:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "No image file provided in form data. Please provide 'file' or 'image'.",
                "detections": [],
            },
        )

    # 1. Read file bytes
    try:
        image_bytes = await upload.read()
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": f"Failed to read uploaded file: {str(exc)}",
                "detections": [],
            },
        )

    # 2. Validate file type and size
    try:
        validate_image_file(
            filename=upload.filename or "unknown.jpg",
            content_type=upload.content_type or "",
            file_size=len(image_bytes),
        )
    except ImageValidationError as exc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": str(exc),
                "detections": [],
            },
        )

    # 3. Decode and validate image bytes with PIL
    try:
        pil_image, width, height = validate_image_bytes(image_bytes)
    except ImageValidationError as exc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": str(exc),
                "detections": [],
            },
        )

    # 4. Pass image to computer vision model
    try:
        analyzer = get_analyzer_service()
        detections, unique_labels, inference_ms = analyzer.analyze(
            image=pil_image,
            conf_threshold=confidence_threshold,
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "An error occurred while analyzing the image.",
                "detail": str(exc),
                "detections": [],
            },
        )

    # 5. Create conversation session for image question-answering
    conversation_manager = get_conversation_manager()
    conversation_id = conversation_manager.create_session(
        image_bytes=image_bytes,
        filename=upload.filename or "uploaded_image.jpg",
        width=width,
        height=height,
        detections=detections,
        unique_labels=unique_labels,
    )

    # 6. Formulate structured response
    message = (
        f"Detected {len(detections)} object{'s' if len(detections) != 1 else ''} "
        f"({', '.join(unique_labels)})"
        if detections
        else "No objects detected with sufficient confidence in this image."
    )

    return ImageAnalysisResponse(
        success=True,
        conversation_id=conversation_id,
        filename=upload.filename,
        message=message,
        detections=detections,
        total_detected=len(detections),
        unique_labels=unique_labels,
        image_width=width,
        image_height=height,
    )
