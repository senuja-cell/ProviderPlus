from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ConversationCreate(BaseModel):
    """
    What the app sends when starting a new conversation
    the user_id is NOT included here - we pull that from the JWT
    so it can never be faked by the client
    """
    provider_id: str
    service_category: Optional[str] = None


class ConversationResponse(BaseModel):
    """
    What we send back to the app after fetching or creating a conversation.
    This is the safe, clean version - only what the frontend needs to see
    """

    id: str
    user_id: str
    provider_id: str
    service_category: Optional[str] = None
    created_at: datetime
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_id(cls, v):
        return str(v)

    class Config:
        from_attributes = True
