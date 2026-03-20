from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import List, Optional
from pydantic import BaseModel

from ..models.category_model import Category
from ..models.provider_model import Provider
from ..models.user_model import User
from ..services.search_service import get_providers_by_slug, get_all_categories, get_category_names
from ..services.cloudinary_service import upload_image, upload_multiple_images
from ..services.gridfs_service import upload_document
from ..core.security import get_current_user

router = APIRouter()


# ─── Schema for profile update ────────────────────────────────────────────────

class ProviderProfileUpdate(BaseModel):
    name:         Optional[str]       = None
    phone_number: Optional[str]       = None
    description:  Optional[str]       = None
    category_id:  Optional[str]       = None
    tags:         Optional[List[str]] = None
    latitude:     Optional[float]     = None
    longitude:    Optional[float]     = None


# ─── Provider auth helper ─────────────────────────────────────────────────────
# Same pattern as get_current_admin in admin_provider_routes.py
# Gets the logged-in User, then finds their Provider document by user_id

async def get_current_provider(
    current_user: User = Depends(get_current_user),
) -> Provider:
    """
    Gets the logged-in user then finds their Provider document via user_id.
    Same pattern used in admin_provider_routes.py.
    """
    provider = await Provider.find_one(Provider.user_id == str(current_user.id))

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No provider profile found for this account.",
        )

    return provider


# ─── Existing public endpoints (unchanged) ───────────────────────────────────

@router.get("/providers/category/{slug}")
async def find_providers_by_category(
    slug: str,
    lat: Optional[float] = None,
    long: Optional[float] = None,
):
    providers = await get_providers_by_slug(slug, user_lat=lat, user_long=long)
    if not providers:
        raise HTTPException(status_code=404, detail="No providers found in this category")
    return providers


@router.get("/categories", response_model=List[Category])
async def get_all_categories_full_endpoint():
    categories = await get_all_categories()
    if not categories:
        raise HTTPException(status_code=404, detail="No categories found")
    return categories


@router.get("/category-names", response_model=list[str])
async def get_category_names_endpoint():
    names = await get_category_names()
    if not names:
        raise HTTPException(status_code=404, detail="No category names found")
    return names


# ─── IMPORTANT: /provider/me routes MUST come BEFORE /provider/{provider_id}
# Otherwise FastAPI treats "me" as a provider_id string

@router.get("/provider/me/profile")
async def get_my_profile(
    current_provider: Provider = Depends(get_current_provider),
):
    """
    Returns the full profile of the logged-in provider.
    Called by ProviderProfileEdit on mount to pre-fill all fields.

    Frontend: GET /api/provider/me/profile
    Headers:  Authorization: Bearer <token>
    """
    category = await current_provider.category.fetch()
    docs = getattr(current_provider, "business_documents", []) or []

    # Get email from the linked User document
    user = await User.find_one(User.id == current_provider.user_id)

    return {
        "id":               str(current_provider.id),
        "name":             current_provider.name,
        "email":            user.email if user else "",
        "phone_number":     current_provider.phone_number,
        "description":      current_provider.description,
        "profile_image":    current_provider.profile_image,
        "portfolio_images": current_provider.portfolio_images or [],
        "is_verified":      current_provider.is_verified,
        "rating":           current_provider.rating,
        "tags":             current_provider.tags or [],
        "location":         current_provider.location,
        "category": {
            "id":   str(category.id),
            "name": category.name,
            "slug": category.slug,
        },
        "total_documents":    len(docs),
        "verified_documents": sum(1 for d in docs if d.get("status") == "verified"),
        "pending_documents":  sum(1 for d in docs if d.get("status") == "pending"),
        "rejected_documents": sum(1 for d in docs if d.get("status") == "rejected"),
    }


@router.patch("/provider/me/profile")
async def update_my_profile(
    body: ProviderProfileUpdate,
    current_provider: Provider = Depends(get_current_provider),
):
    """
    Updates the provider's text fields (PATCH — only sent fields are updated).

    Frontend: PATCH /api/provider/me/profile
    Headers:  Authorization: Bearer <token>
    Body (JSON): name, phone_number, description, category_id, tags,
                 latitude, longitude
    """
    update_data = body.model_dump(exclude_none=True)

    # Category change — fetch new Category document by ID
    if "category_id" in update_data:
        try:
            new_category = await Category.get(update_data.pop("category_id"))
        except Exception:
            raise HTTPException(status_code=404, detail="Category not found")
        current_provider.category = new_category

    # Location — both lat and lng must come together
    lat = update_data.pop("latitude", None)
    lng = update_data.pop("longitude", None)
    if lat is not None and lng is not None:
        current_provider.location = {
            "type": "Point",
            "coordinates": [lng, lat],
        }

    # Apply remaining scalar fields (name, phone_number, description, tags)
    for field, value in update_data.items():
        setattr(current_provider, field, value)

    await current_provider.save()
    return {"message": "Profile updated successfully"}


@router.post("/provider/me/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_provider: Provider = Depends(get_current_provider),
):
    """
    Uploads a new profile picture to Cloudinary.

    Frontend: POST /api/provider/me/profile-image
    Headers:  Authorization: Bearer <token>
    Body:     multipart/form-data → field name: "file"
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    url = await upload_image(file, folder="providers/profile")
    current_provider.profile_image = url
    await current_provider.save()

    return {"profile_image": url, "message": "Profile image updated"}


@router.post("/provider/me/portfolio-images")
async def upload_portfolio_images(
    files: List[UploadFile] = File(...),
    current_provider: Provider = Depends(get_current_provider),
):
    """
    Uploads portfolio images to Cloudinary.
    New URLs are appended to the existing list.

    Frontend: POST /api/provider/me/portfolio-images
    Headers:  Authorization: Bearer <token>
    Body:     multipart/form-data → field name: "files" (multiple allowed)
    """
    for f in files:
        if not f.content_type or not f.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"File '{f.filename}' must be an image",
            )

    urls = await upload_multiple_images(files, folder="providers/portfolio")
    existing = current_provider.portfolio_images or []
    current_provider.portfolio_images = existing + urls
    await current_provider.save()

    return {
        "uploaded_urls": urls,
        "all_portfolio":  current_provider.portfolio_images,
        "message":        f"{len(urls)} image(s) added to portfolio",
    }


@router.post("/provider/me/documents")
async def upload_identity_documents(
    files: List[UploadFile] = File(...),
    document_type: str = Form(...),
    current_provider: Provider = Depends(get_current_provider),
):
    """
    Uploads NIC images or BR certificate files to GridFS for admin review.

    Frontend: POST /api/provider/me/documents
    Headers:  Authorization: Bearer <token>
    Body:     multipart/form-data
                  document_type: "nic" | "br_certificate"
                  files: [<image or PDF>, ...]
    """
    allowed_types = {"nic", "br_certificate"}
    if document_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"document_type must be one of: {allowed_types}",
        )

    uploaded = []

    for file in files:
        allowed_mime = {"image/jpeg", "image/png", "image/jpg"}
        if document_type == "br_certificate":
            allowed_mime.add("application/pdf")

        if file.content_type not in allowed_mime:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has unsupported type",
            )

        file_id = await upload_document(
            file,
            metadata={
                "provider_id":   str(current_provider.id),
                "document_type": document_type,
                "status":        "pending",
            },
        )

        uploaded.append({
            "file_id":  file_id,
            "filename": file.filename,
            "type":     document_type,
            "status":   "pending",
        })

    existing_docs = getattr(current_provider, "business_documents", []) or []
    current_provider.business_documents = existing_docs + uploaded
    await current_provider.save()

    return {
        "uploaded": uploaded,
        "message":  f"{len(uploaded)} document(s) submitted for review",
    }


# ─── Public provider endpoints ────────────────────────────────────────────────

@router.get("/provider/{provider_id}")
async def get_provider_by_id(provider_id: str):
    """Public profile — visible to customers."""
    try:
        provider = await Provider.get(provider_id)
    except Exception:
        provider = None

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    category = await provider.category.fetch()

    return {
        "id":               str(provider.id),
        "name":             provider.name,
        "description":      provider.description,
        "is_verified":      provider.is_verified,
        "rating":           provider.rating,
        "tags":             provider.tags or [],
        "profile_image":    provider.profile_image,
        "portfolio_images": provider.portfolio_images or [],
        "phone_number":     provider.phone_number,
        "category": {
            "id":   str(category.id),
            "name": category.name,
            "slug": category.slug,
        },
    }


@router.get("/provider/{provider_id}/dashboard")
async def get_provider_dashboard(provider_id: str):
    """Returns dashboard stats for the provider."""
    try:
        provider = await Provider.get(provider_id)
    except Exception:
        provider = None

    provider_rating = provider.rating if provider else 4.8

    return {
        "completedJobs":     0,
        "upcomingJobs":      0,
        "notifications":     0,
        "rating":            provider_rating,
        "totalReviews":      0,
        "customerResponses": 0,
        "reSchedules":       0,
    }
