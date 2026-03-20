from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ─── Signup ───────────────────────────────────────────────────────────────────

class ProviderSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone_number: str
    category_id: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ─── Profile Update ───────────────────────────────────────────────────────────

class ProviderProfileUpdate(BaseModel):
    """
    Fields the provider can update from ProviderProfiledit.
    All optional — only fields sent will be updated (PATCH behaviour).
    NIC and BR certificate are handled as file uploads, not text.
    """
    name:         Optional[str]       = None
    phone_number: Optional[str]       = None
    description:  Optional[str]       = None   # service description
    category_id:  Optional[str]       = None   # allow changing category
    tags:         Optional[List[str]] = None   # skills
    latitude:     Optional[float]     = None
    longitude:    Optional[float]     = None


# ─── Responses ────────────────────────────────────────────────────────────────

class MyProfileResponse(BaseModel):
    """Full profile returned to the logged-in provider for the edit screen."""
    id:            str
    name:          str
    email:         str
    phone_number:  str
    category:      dict
    description:   str
    profile_image: Optional[str]
    portfolio_images: List[str]
    is_verified:   bool
    rating:        float
    tags:          List[str]
    location:      Optional[dict]
    total_documents:    int
    verified_documents: int
    pending_documents:  int
    rejected_documents: int


class ProviderResponse(BaseModel):
    id:            str
    name:          str
    email:         str
    phone_number:  str
    category:      dict
    description:   str
    profile_image: Optional[str]
    portfolio_images: List[str]
    is_verified:   bool
    rating:        float
    tags:          List[str]
    location:      Optional[dict]
    total_documents:    int
    verified_documents: int
    pending_documents:  int
    rejected_documents: int


class AdminProviderDetailResponse(BaseModel):
    id:                 str
    name:               str
    email:              str
    phone_number:       str
    category:           dict
    description:        str
    profile_image:      Optional[str]
    portfolio_images:   List[str]
    is_verified:        bool
    business_documents: List[dict]
    created_at:         datetime
    updated_at:         datetime


class DocumentUploadResponse(BaseModel):
    file_id:     str
    filename:    str
    type:        str
    status:      str = "pending"
    uploaded_at: datetime


class PortfolioUploadResponse(BaseModel):
    urls: List[str]


class DocumentVerificationRequest(BaseModel):
    document_index:   int
    action:           str             # "verify" or "reject"
    rejection_reason: Optional[str] = None