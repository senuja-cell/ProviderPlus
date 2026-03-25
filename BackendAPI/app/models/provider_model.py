from beanie import Document, Link
from typing import List, Optional
from pydantic import Field
from datetime import datetime
from .category_model import Category


class BusinessDocument(dict):
    """
    Structure for business documents stored in GridFS.

    Example structure:
    {
        "file_id":          "gridfs_object_id",
        "filename":         "business_license.pdf",
        "type":             "nic" | "br_certificate" | "business_license" | "certification",
        "status":           "pending" | "verified" | "rejected",
        "uploaded_at":      datetime,
        "verified_at":      datetime or None,
        "rejection_reason": "Document unclear" or None
    }
    """
    pass


class Provider(Document):
    # ── Identity ──────────────────────────────────────────────────────────────
    name:         str
    email:        Optional[str] = None              # optional — fetched from User document
    phone_number: str
    user_id:      str

    # ── Service Info ──────────────────────────────────────────────────────────
    category:    Link[Category]
    description: str
    tags:        List[str] = []              # skills

    # ── Media ─────────────────────────────────────────────────────────────────
    profile_image:    Optional[str]  = None
    portfolio_images: List[str]      = []

    # ── Location ──────────────────────────────────────────────────────────────
    # GeoJSON format: { "type": "Point", "coordinates": [longitude, latitude] }
    location: Optional[dict] = None

    # ── Verification ──────────────────────────────────────────────────────────
    is_verified:        bool        = False
    # Each entry follows the BusinessDocument structure above
    business_documents: List[dict]  = []

    # ── Stats ─────────────────────────────────────────────────────────────────
    rating:       float = 0.0   # weighted running average
    rating_count: int   = 0     # total number of ratings received

    # ── Status ────────────────────────────────────────────────────────────────
    is_active:  bool     = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "providers"
