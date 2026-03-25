from beanie import Document
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class BookingStatus(str, Enum):
    pending   = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class Booking(Document):
    user_id:         str
    provider_id:     str
    conversation_id: str
    date:            str
    time:            str
    summary:         str
    created_at:      datetime = datetime.utcnow()
    status:          BookingStatus = BookingStatus.pending

    user_latitude:  Optional[float] = None
    user_longitude: Optional[float] = None

    sp_live_latitude:   Optional[float]    = None
    sp_live_longitude:  Optional[float]    = None
    sp_live_updated_at: Optional[datetime] = None

    # ── Rating (filled in by user after job is completed) ─────────────────────
    rating:      Optional[int]      = None   # 1–5 stars; None = not yet rated
    review_text: Optional[str]      = None   # optional written review
    rated_at:    Optional[datetime] = None   # timestamp of when the rating was submitted

    class Settings:
        name = "bookings"


# ── Read models ───────────────────────────────────────────────────────────────

class BookingWithProvider(BaseModel):
    booking_id:    str
    provider_id:   str
    provider_name: str
    category_name: str
    summary:       str
    date:          str
    time:          str
    status:        str
    created_at:    datetime
    rating:        Optional[int] = None
    review_text:   Optional[str] = None
    rated_at:      Optional[datetime] = None


class BookingWithCustomer(BaseModel):
    booking_id:      str
    conversation_id: str
    user_id:         str
    user_name:       str
    category_name:   str
    summary:         str
    date:            str
    time:            str
    status:          str
    created_at:      datetime
    user_latitude:   Optional[float] = None
    user_longitude:  Optional[float] = None
    rating:          Optional[int]   = None
    review_text:     Optional[str]   = None
    rated_at:        Optional[datetime] = None
