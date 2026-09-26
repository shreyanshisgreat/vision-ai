import io
from pathlib import Path
from typing import Tuple
from PIL import Image, UnidentifiedImageError

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/x-ms-bmp",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class ImageValidationError(ValueError):
    """Custom exception raised when uploaded image fails validation."""
    pass


def validate_image_file(filename: str, content_type: str, file_size: int) -> None:
    """
    Validate filename extension, MIME content type, and payload size.
    Raises ImageValidationError if invalid.
    """
    if not filename:
        raise ImageValidationError("No filename provided.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ImageValidationError(
            f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise ImageValidationError(
            f"Invalid content type '{content_type}'. Must be an image (JPEG, PNG, WEBP, BMP)."
        )

    if file_size <= 0:
        raise ImageValidationError("Uploaded image file is empty (0 bytes).")

    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
        actual_mb = file_size / (1024 * 1024)
        raise ImageValidationError(
            f"File size exceeds maximum allowed limit of {max_mb:.1f} MB (received {actual_mb:.1f} MB)."
        )


def validate_image_bytes(image_bytes: bytes) -> Tuple[Image.Image, int, int]:
    """
    Validate that byte content is a valid, readable image and returns (PIL Image, width, height).
    Raises ImageValidationError if bytes are corrupted or not a valid image format.
    """
    if not image_bytes:
        raise ImageValidationError("Empty image payload received.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        
        # Re-open because verify() consumes the stream and marks image unreadable
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        width, height = image.size
        return image, width, height
    except UnidentifiedImageError:
        raise ImageValidationError("The file could not be recognized as a valid image.")
    except Exception as exc:
        raise ImageValidationError("The uploaded file is corrupt or not a valid image.")

