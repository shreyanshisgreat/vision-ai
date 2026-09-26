from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Coordinates for detected object bounding box [x1, y1, x2, y2]."""
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionItem(BaseModel):
    """Individual object detection item."""
    label: str = Field(..., description="Detected object class label (e.g. person, laptop)")
    confidence: float = Field(..., description="Detection confidence score between 0.0 and 1.0")
    box: Optional[BoundingBox] = Field(default=None, description="Optional bounding box coordinates")


class ImageAnalysisResponse(BaseModel):
    """Response schema for image analysis endpoint."""
    success: bool = True
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected objects")
    total_detected: int = Field(default=0, description="Total number of detected objects")
    unique_labels: List[str] = Field(default_factory=list, description="Unique object categories detected")
    filename: Optional[str] = Field(default=None, description="Uploaded image filename")
    image_width: Optional[int] = Field(default=None, description="Original image width in pixels")
    image_height: Optional[int] = Field(default=None, description="Original image height in pixels")
    message: Optional[str] = Field(default=None, description="Human-readable summary or status message")


class ErrorResponse(BaseModel):
    """Structured error response schema."""
    success: bool = False
    error: str = Field(..., description="Error message describing the issue")
    detail: Optional[str] = Field(default=None, description="Additional context or technical detail")
