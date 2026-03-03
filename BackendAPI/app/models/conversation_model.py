from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class Conversation(Document):
    """
    Represents a conversation thread between a user and a provider.
    One conversation per unique user+provider pair — never duplicated.
    """
    user_id: str
    provider_id: str
    service_category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None

    class Settings:
        name = "conversations"  # This is the MongoDB collection name
