from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookingCreate(BaseModel):
    """What the frontend sends when finalizing a booking from the chat modal."""
    conversation_id: str
    provider_id: str
    date: str        # YYYY-MM-DD
    time: str        # HH:MM (24hr)
    summary: str
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None

class BookingResponse(BaseModel):
    """What we send back — the frontend uses booking_id + amount to navigate to payment."""
    booking_id: str
    status: str
