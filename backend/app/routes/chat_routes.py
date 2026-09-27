from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.schemas import ChatRequest, ChatResponse, ClearChatResponse, ErrorResponse
from app.services.chatbot import get_chatbot_service
from app.services.conversation_manager import get_conversation_manager

router = APIRouter(prefix="/api/chat", tags=["Conversational Image Q&A"])


@router.post(
    "",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid question or request payload"},
        404: {"model": ErrorResponse, "description": "No active image session found"},
        500: {"model": ErrorResponse, "description": "Internal chatbot error"},
    },
    summary="Ask a question about the active uploaded image",
)
async def chat_with_image(req: ChatRequest):
    """
    Receives a natural language question about an uploaded image.
    Looks up the conversation session by conversation_id,
    and returns a grounded AI-generated answer.
    """
    clean_question = req.question.strip() if req.question else ""
    if not clean_question:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "Question cannot be empty. Please ask a question about the image.",
            },
        )

    if not req.conversation_id or not req.conversation_id.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "No conversation_id provided. Please upload and analyze an image first.",
            },
        )

    conversation_manager = get_conversation_manager()
    session = conversation_manager.get_session(req.conversation_id.strip())

    if session is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": (
                    "No active image conversation found for this ID. "
                    "Your session may have expired or no image was uploaded. "
                    "Please upload an image to start chatting."
                ),
            },
        )

    try:
        chatbot_service = get_chatbot_service()
        
        # 1. Generate answer using current image context and dialogue history
        answer, source = chatbot_service.answer_question(session, clean_question)

        # 2. Append both user question and assistant answer to session history
        session.add_message("user", clean_question)
        session.add_message("assistant", answer)

        return ChatResponse(
            success=True,
            answer=answer,
            conversation_id=session.conversation_id,
            source=source,
        )
    except Exception as exc:
        print(f"[ChatRoute Error] Failed to process question: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Failed to generate an answer due to an internal error. Please try again.",
                "detail": str(exc),
            },
        )


@router.post(
    "/clear",
    response_model=ClearChatResponse,
    summary="Clear conversation history for the current image session",
)
async def clear_chat(payload: Dict[str, str]):
    """
    Clears message history for the given conversation_id
    while keeping the uploaded image context intact.
    """
    conversation_id = payload.get("conversation_id", "").strip()
    if not conversation_id:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "conversation_id is required to clear conversation."},
        )

    conversation_manager = get_conversation_manager()
    success = conversation_manager.clear_messages(conversation_id)

    if not success:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "error": "Session not found or already expired."},
        )

    return ClearChatResponse(
        success=True,
        message="Conversation history cleared successfully.",
        conversation_id=conversation_id,
    )


@router.get(
    "/history/{conversation_id}",
    summary="Get conversation history for an active session",
)
async def get_history(conversation_id: str):
    """Retrieve all messages in this conversation session."""
    conversation_manager = get_conversation_manager()
    session = conversation_manager.get_session(conversation_id)

    if session is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "error": "Conversation session not found."},
        )

    return {
        "success": True,
        "conversation_id": conversation_id,
        "filename": session.image_filename,
        "message_count": len(session.messages),
        "messages": session.messages,
    }
