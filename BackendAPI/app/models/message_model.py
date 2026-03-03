from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class Message(Document):
    """
    Represents a single message within a conversation.
    Every message belongs to a conversation and has a sender and recipient.
    """
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    delivered: bool = False

    class Settings:
        name = "messages"  # This is the MongoDB collection name
