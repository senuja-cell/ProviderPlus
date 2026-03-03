from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    """
    what the app sends when a user types and hits send.
    only the content is needed, everything else (who sent, which conversation it belongs to)
    is derived server-side.
    this is sent through the WebSocket, not a regular HTTP request
    """

    content: str


class MessageResponse(BaseModel):
    """
    What we send back after a message is saved.
    this is what both the sender and recipient receive through the WebSocket
    so both sides update their UI instantly.
    """

    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    sent_at: datetime
    read_at: Optional[datetime] = None
    delivered: bool

    class Config:
        from_attributes: True


class MessageReadUpdate(BaseModel):
    """
    sent by the app when the recipient opens and reads a message
    triggers the server to fill in the read_at timestamp on that message
    this is how you get "seen" receipts
    """

    message_id: str


class PushTokenRegister(BaseModel):
    """
    sent by the app on startup to register or update the device's push token
    without this, we have no way to send push notifications to the device
    """

    expo_push_token: str
    device_info: Optional[str] = None



