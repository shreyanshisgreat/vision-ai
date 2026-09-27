from typing import Optional
from fastapi import APIRouter, File, Form, Request, UploadFile, status
from fastapi.responses import JSONResponse

from app.models.schemas import ErrorResponse, SummaryRequest, SummaryResponse
from app.services.chatbot import get_chatbot_service
from app.services.conversation_manager import get_conversation_manager
from app.services.image_analyzer import get_analyzer_service
from app.utils.image_validator import ImageValidationError, validate_image_bytes

router = APIRouter(prefix="/api/vision", tags=["Vision Understanding"])


@router.post(
    "/summary",
    response_model=SummaryResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image or missing conversation_id"},
        404: {"model": ErrorResponse, "description": "Session not found"},
        500: {"model": ErrorResponse, "description": "Internal summary generation error"},
    },
    summary="Generate an automatic concise visual summary of an image",
)
async def get_image_summary(request: Request):
    """
    Generates a concise 2-4 sentence natural-language summary of what is seen in the image.
    Accepts either:
    1. JSON body with `conversation_id`: reuses the active analyzed image session in memory.
    2. Multipart form data with `file` / `image`: uploads and analyzes a new image.
    This summary is NOT added to session dialogue history and does not create fake chat messages.
    """
    content_type = request.headers.get("content-type", "")
    conversation_id: Optional[str] = None
    image_bytes: Optional[bytes] = None
    filename = "uploaded_image.jpg"

    if "application/json" in content_type:
        try:
            body = await request.json()
            conversation_id = body.get("conversation_id")
        except Exception as exc:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"success": False, "error": f"Invalid JSON payload: {str(exc)}"},
            )
    elif "multipart/form-data" in content_type:
        form = await request.form()
        conversation_id = form.get("conversation_id")
        file_upload = form.get("file") or form.get("image")
        if file_upload and hasattr(file_upload, "read"):
            image_bytes = await file_upload.read()
            filename = getattr(file_upload, "filename", "uploaded_image.jpg")
    else:
        # Fallback to query param or empty json attempt
        conversation_id = request.query_params.get("conversation_id")

    conversation_manager = get_conversation_manager()
    chatbot_service = get_chatbot_service()

    # Case A: conversation_id provided -> lookup existing image session
    if conversation_id and str(conversation_id).strip():
        cid = str(conversation_id).strip()
        session = conversation_manager.get_session(cid)
        if session is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": "No active image session found for this conversation_id. Please analyze the image first.",
                },
            )

        try:
            summary, source = chatbot_service.generate_image_summary(session)
            return SummaryResponse(
                success=True,
                summary=summary,
                source=source,
                conversation_id=session.conversation_id,
            )
        except Exception as exc:
            print(f"[VisionRoute Error] Summary generation failed: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": "Failed to generate image summary.",
                    "detail": str(exc),
                },
            )

    # Case B: Image file uploaded directly in request
    if image_bytes:
        try:
            pil_image, width, height = validate_image_bytes(image_bytes)
            analyzer = get_analyzer_service()
            detections, unique_labels, _ = analyzer.analyze(image=pil_image)
            temp_cid = conversation_manager.create_session(
                image_bytes=image_bytes,
                filename=filename,
                width=width,
                height=height,
                detections=detections,
                unique_labels=unique_labels,
            )
            session = conversation_manager.get_session(temp_cid)
            summary, source = chatbot_service.generate_image_summary(session)
            return SummaryResponse(
                success=True,
                summary=summary,
                source=source,
                conversation_id=temp_cid,
            )
        except ImageValidationError as exc:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"success": False, "error": str(exc)},
            )
        except Exception as exc:
            print(f"[VisionRoute Error] Direct summary generation failed: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "error": "Internal error during visual summary.", "detail": str(exc)},
            )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": "Please provide either 'conversation_id' in JSON body or an image file in form data.",
        },
    )
