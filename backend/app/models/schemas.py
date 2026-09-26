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
    conversation_id: Optional[str] = Field(default=None, description="Unique conversation session ID for Q&A")
    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected objects")
    total_detected: int = Field(default=0, description="Total number of detected objects")
    unique_labels: List[str] = Field(default_factory=list, description="Unique object categories detected")
    filename: Optional[str] = Field(default=None, description="Uploaded image filename")
    image_width: Optional[int] = Field(default=None, description="Original image width in pixels")
    image_height: Optional[int] = Field(default=None, description="Original image height in pixels")
    message: Optional[str] = Field(default=None, description="Human-readable summary or status message")


class ChatMessage(BaseModel):
    """Individual message in conversation history."""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")
    timestamp: Optional[float] = Field(default=None, description="Message unix timestamp")


class ChatRequest(BaseModel):
    """Request schema for conversational question answering."""
    question: str = Field(..., description="Natural language question about the uploaded image")
    conversation_id: str = Field(..., description="Session/conversation identifier referencing the active image")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Optional previous dialogue history")


class ChatResponse(BaseModel):
    """Response schema for conversational question answering."""
    success: bool = True
    answer: str = Field(..., description="AI-generated answer grounded in the uploaded image")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID")
    source: Optional[str] = Field(default=None, description="Source engine: 'multimodal_api' or 'vision_engine'")


class ClearChatResponse(BaseModel):
    """Response schema for clearing chat dialogue."""
    success: bool = True
    message: str = Field(..., description="Confirmation message")
    conversation_id: str = Field(..., description="Conversation session ID")


class ErrorResponse(BaseModel):
    """Structured error response schema."""
    success: bool = False
    error: str = Field(..., description="Error message describing the issue")
    detail: Optional[str] = Field(default=None, description="Additional context or technical detail")
