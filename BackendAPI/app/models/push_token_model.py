from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class PushToken(Document):
    """
    Stores the Expo push notification token for each user/provider device.
    Registered on app startup. Used to send notifications when recipient is offline.
    """
    user_id: str
    expo_push_token: str
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    device_info: Optional[str] = None

    class Settings:
        name = "push_tokens"  # This is the MongoDB collection name
