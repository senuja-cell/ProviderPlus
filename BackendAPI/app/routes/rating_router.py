from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from ..models.user_model import User
from ..models.booking_model  import Booking, BookingStatus
from ..models.provider_model import Provider
from ..core.security import get_current_user

router = APIRouter(prefix="/bookings", tags=["ratings"])


# ── Request / response schemas ────────────────────────────────────────────────

class RatingRequest(BaseModel):
    rating:      int            = Field(..., ge=1, le=5, description="Star rating 1–5")
    review_text: Optional[str]  = Field(None, max_length=500)


class RatingResponse(BaseModel):
    booking_id:  str
    rating:      int
    review_text: Optional[str]
    rated_at:    datetime
    message:     str


class ProviderRatingEntry(BaseModel):
    """One row in the provider's ratings list."""
    booking_id:   str
    user_name:    str
    rating:       int
    review_text:  Optional[str]
    rated_at:     datetime
    job_summary:  str
    job_date:     str


# ── POST /bookings/{booking_id}/rate ─────────────────────────────────────────

@router.post(
    "/{booking_id}/rate",
    response_model=RatingResponse,
    status_code=status.HTTP_200_OK,
)
async def submit_rating(
        booking_id: str,
        payload:    RatingRequest,
        current_user = Depends(get_current_user),
):
    # 1. Fetch booking
    booking = await Booking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # 3. Must be completed (not pending / confirmed / cancelled)
    if booking.status != BookingStatus.completed:
        raise HTTPException(
            status_code=400,
            detail="Only completed bookings can be rated.",
        )

    # 4. Prevent double-rating
    if booking.rating is not None:
        raise HTTPException(
            status_code=409,
            detail="This booking has already been rated.",
        )

    # 5. Persist rating on the booking
    now = datetime.utcnow()
    booking.rating      = payload.rating
    booking.review_text = payload.review_text
    booking.rated_at    = now
    await booking.save()

    # 6. Update provider's running average
    #    new_avg = (old_avg * old_count + new_stars) / (old_count + 1)
    provider = await Provider.get(booking.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found.")

    old_count          = provider.rating_count
    old_avg            = provider.rating
    provider.rating       = round(
        (old_avg * old_count + payload.rating) / (old_count + 1), 2
    )
    provider.rating_count = old_count + 1
    provider.updated_at   = now
    await provider.save()

    return RatingResponse(
        booking_id  = str(booking.id),
        rating      = booking.rating,
        review_text = booking.review_text,
        rated_at    = booking.rated_at,
        message     = "Rating submitted successfully.",
    )


# ── GET /bookings/provider/{provider_id}/ratings ──────────────────────────────
# Used by the provider's account screen to list all ratings they have received.

@router.get(
    "/provider/{provider_id}/ratings",
    response_model=List[ProviderRatingEntry],
    status_code=status.HTTP_200_OK,
)
async def list_provider_ratings(
        provider_id: str
):
    """
    Returns every rated booking for a given provider, newest first.
    Intended for the provider's own account screen.
    Adjust the auth guard below if you want to restrict this to the
    provider themselves (current_user.provider_id == provider_id).
    """
    rated_bookings: List[Booking] = await Booking.find(
        Booking.provider_id == provider_id,
        Booking.rating      != None,           # noqa: E711  (Beanie / Motor requires != None)
    ).sort(-Booking.rated_at).to_list()

    # Collect all unique user IDs so we can resolve names in one pass
    # (replace this with however your project resolves user names)
    from ..models.user_model import User   # adjust to your user model import

    user_ids   = list({b.user_id for b in rated_bookings})
    users      = await User.find({"_id": {"$in": user_ids}}).to_list()
    user_map   = {str(u.id): u.name for u in users}

    return [
        ProviderRatingEntry(
            booking_id  = str(b.id),
            user_name   = user_map.get(b.user_id, "Anonymous"),
            rating      = b.rating,
            review_text = b.review_text,
            rated_at    = b.rated_at,
            job_summary = b.summary,
            job_date    = b.date,
        )
        for b in rated_bookings
    ]
