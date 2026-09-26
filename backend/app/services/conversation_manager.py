import time
import uuid
from dataclasses import dataclass, field
from threading import Lock
from typing import Any, Dict, List, Optional

from app.models.schemas import DetectionItem


@dataclass
class ConversationSession:
    """Stores active image context and conversation dialogue."""
    conversation_id: str
    image_bytes: bytes
    image_filename: str
    image_width: int
    image_height: int
    detections: List[DetectionItem]
    unique_labels: List[str]
    messages: List[Dict[str, Any]] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the session's conversation history."""
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": time.time(),
        })
        self.updated_at = time.time()

    def clear_messages(self) -> None:
        """Clear conversation message history while keeping image context."""
        self.messages = []
        self.updated_at = time.time()


class ConversationManager:
    """
    Manages active conversation sessions in memory.
    Ensures image context persists across follow-up questions,
    and isolates conversations between different image uploads.
    """

    def __init__(self, max_idle_seconds: int = 7200):
        self._sessions: Dict[str, ConversationSession] = {}
        self._lock = Lock()
        self.max_idle_seconds = max_idle_seconds

    def create_session(
        self,
        image_bytes: bytes,
        filename: str,
        width: int,
        height: int,
        detections: List[DetectionItem],
        unique_labels: List[str],
    ) -> str:
        """Create a new conversation session associated with an uploaded image."""
        self._cleanup_expired()
        conversation_id = uuid.uuid4().hex[:12]
        
        session = ConversationSession(
            conversation_id=conversation_id,
            image_bytes=image_bytes,
            image_filename=filename,
            image_width=width,
            image_height=height,
            detections=detections,
            unique_labels=unique_labels,
        )

        with self._lock:
            self._sessions[conversation_id] = session

        return conversation_id

    def get_session(self, conversation_id: str) -> Optional[ConversationSession]:
        """Retrieve an active session by its ID."""
        with self._lock:
            session = self._sessions.get(conversation_id)
            if session:
                session.updated_at = time.time()
            return session

    def add_message(self, conversation_id: str, role: str, content: str) -> bool:
        """Append a message to an existing session."""
        with self._lock:
            session = self._sessions.get(conversation_id)
            if session:
                session.add_message(role, content)
                return True
            return False

    def clear_messages(self, conversation_id: str) -> bool:
        """Clear chat messages in a session while preserving the image context."""
        with self._lock:
            session = self._sessions.get(conversation_id)
            if session:
                session.clear_messages()
                return True
            return False

    def delete_session(self, conversation_id: str) -> bool:
        """Remove a session from memory."""
        with self._lock:
            return self._sessions.pop(conversation_id, None) is not None

    def _cleanup_expired(self) -> None:
        """Remove idle sessions that have exceeded the TTL."""
        now = time.time()
        with self._lock:
            expired_keys = [
                cid
                for cid, s in self._sessions.items()
                if (now - s.updated_at) > self.max_idle_seconds
            ]
            for cid in expired_keys:
                del self._sessions[cid]


# Global singleton instance
_manager_instance: Optional[ConversationManager] = None


def get_conversation_manager() -> ConversationManager:
    """Retrieve or initialize the global conversation manager singleton."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = ConversationManager()
    return _manager_instance
