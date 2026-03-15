from fastapi import APIRouter, HTTPException, status,  File, UploadFile, Depends, Form
from typing import List, Optional
from datetime import datetime
from ..models.provider_model import Provider
from ..models.user_model import User, UserRole
from ..models.category_model import Category
from ..schemas.provider_schemas import ProviderSignupRequest, DocumentUploadResponse, PortfolioUploadResponse, ProviderResponse
from ..core.security import get_password_hash, verify_password, create_access_token, get_current_user
from ..services.gridfs_service import upload_document, download_document
from ..services.cloudinary_service import upload_image, upload_multiple_images
from fastapi.responses import StreamingResponse
import io
from beanie import Link


router = APIRouter(prefix="/auth/provider", tags=["Provider Auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def provider_signup(
        email: str = Form(...),
        password: str = Form(...),
        name: str = Form(...),
        phone_number: str = Form(...),
        category_id: str = Form(...),
        description: str = Form(...),
        latitude: Optional[float] = Form(None),
        longitude: Optional[float] = Form(None),
        tags: List[str] = Form(default=[])
):
    """
    provider registration - step 1:  account creation
    creates user account and provider profile
    provider stats with is_verified=False until documents are  uploaded and verified
    """

    # 1. check if email already exists
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. verify category exists
    category = await Category.get(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # 3. create provider account
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        full_name=name,
        phone_number=phone_number,
        role=UserRole.PROVIDER
    )
    await user.insert()

    # create provider profile
    location_data = None
    if latitude and longitude:
        location_data = {
            "type": "Point",
            "coordinates": [longitude, latitude]
        }

    provider = Provider(
        name=name,
        category=category,
        description=description,
        phone_number=phone_number,
        location=location_data,
        user_id=str(user.id),
        is_verified=False,
        business_documents=[],
        portfolio_images=[],
        tags=tags
    )
    await provider.insert()

    user.provider_profile_id = str(provider.id)
    await user.save()

    token = create_access_token({"sub": str(user.id), "role": "provider"})

    return {
        "message": "Registration successful! please upload your documents to complete verification",
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "provider_id": str(provider.id),
        "is_verified": False
    }


# LOGIN

@router.post("/login")
async def provider_login(email: str = Form(...), password: str = Form(...)):
    """
    provider login
    note: providers can login even if not verified
    """

    user = await User.find_one(User.email == email, User.role == UserRole.PROVIDER)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(password,  user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    provider = await Provider.find_one(Provider.user_id == str(user.id))
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )

    token = create_access_token({"sub": str(user.id), "role": "provider"})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "provider_id": str(provider.id),
        "is_verified": provider.is_verified,
        "message": "Login successful!" if provider.is_verified else "Login successful! Please complete document "
                                                                    "verification"
    }


# document upload


@router.post("/upload-documents", response_model=List[DocumentUploadResponse])
async def upload_business_documents(
        files: List[UploadFile] = File(...),
        document_types: List[str] = Form(...),
        current_user: User = Depends(get_current_user)
):
    """
    upload business documents to GridFS
    document types: business_license, certification, id_proof
    """

    provider = await Provider.find_one(Provider.user_id == str(current_user.id))
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    for file in files:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files allowed. Got: {file.filename}"
            )

    uploaded_docs = []

    for file, doc_type in zip(files, document_types):
        # upload to gridfs
        file_id = await upload_document(
            file,
            metadata={
                "provider_id": str(provider.id),
                "document_type": doc_type
            }
        )

        # create document record
        doc_record = {
            "file_id": file_id,
            "filename": file.filename,
            "type": doc_type,
            "status": "pending",
            "uploaded_at": datetime.utcnow(),
            "verified_at": None,
            "rejection_reason": None
        }

        provider.business_documents.append(doc_record)

        uploaded_docs.append(DocumentUploadResponse(
            file_id=file_id,
            filename=file.filename,
            type=doc_type,
            status="pending",
            uploaded_at=doc_record["uploaded_at"]
        ))

    provider.updated_at = datetime.utcnow()
    await provider.save()

    return uploaded_docs


# PORTFOLIO UPLOAD

@router.post("/upload-portfolio", response_model=PortfolioUploadResponse)
async def upload_portfolio_images(
        files: List[UploadFile] = File(...),
        current_user: User = Depends(get_current_user)
):
    """
    upload portfolio images to Cloudinary
    max 10 images recommended
    """

    # 1. get provider profile
    provider = await Provider.find_one(Provider.user_id == str(current_user.id))
    if not provider:
        raise  HTTPException(status_code=404, detail="Provider profile not found")


    # 2. validate file types
    allowed_extensions = ['.jpg', 'jpeg', '.png', '.webp']
    for file in files:
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Only image files allowed (jpg, png, webp). Got: {file.filename}"
            )

    # 3. upload to cloudinary
    urls = await upload_multiple_images(files, folder=f"providers/{provider.id}/portfolio")

    # 4. add URLs to provider's portfolio
    provider.portfolio_images.extend(urls)
    provider.updated_at = datetime.utcnow()
    await provider.save()

    return PortfolioUploadResponse(urls=urls)


# PROFILE IMAGE UPLOAD

@router.post("/upload-profile-image")
async def upload_profile_image(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    """
    upload profile image to Cloudinary
    """
    provider = await Provider.find_one(Provider.user_id == str(current_user))
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Only image files allowed (jpg, png, webp)"
        )

    url = await upload_image(file, folder=f"providers/{provider.id}/profile")

    provider.profile_image = url
    provider.updated_at = datetime.utcnow()
    await provider.save()

    return {"url": url}


# DOWNLOAD DOCUMENT
@router.get("/documents/{file_id}")
async def download_business_document(
        file_id: str,
        current_user: User =  Depends(get_current_user)
):
    """
    download a business document from gridfs
    providers can only  download their own documentts
    admins can download any document
    """

    provider = await Provider.find_one(Provider.user_id == str(current_user.id))

    if current_user.role != UserRole.ADMIN:
        if not provider:
            raise HTTPException(status_code=403, detail="Not authorized")

        doc_found = any(doc['file_id'] == file_id for doc in  provider.business_documents)
        if not doc_found:
            raise HTTPException(status_code=403, detail="Not authorized")

    try:
        content = await download_document(file_id)

        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=document_{file_id}.pdf"}
        )

    except Exception as e:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/me", response_model=ProviderResponse)
async def get_my_provider_profile(current_user: User = Depends(get_current_user)):
    """
    get  current provider's profile with document verification status
    """
    provider = await Provider.find_one(Provider.user_id == str(current_user.id))

    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")


    total_docs = len(provider.business_documents)
    verified_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'verified')
    pending_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'pending')
    rejected_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'rejected')

    category = await provider.category.fetch()

    return ProviderResponse(
        id=str(provider.id),
        name=provider.name,
        email=current_user.email,
        phone_number=provider.phone_number,
        category={"id": str(category.id), "name": category.name, "slug": category.slug},
        description=provider.description,
        profile_image=provider.profile_image,
        portfolio_images=provider.portfolio_images,
        is_verified=provider.is_verified,
        rating=provider.rating,
        tags=provider.tags,
        location=provider.location,
        total_documents=total_docs,
        verified_documents=verified_docs,
        pending_documents=pending_docs,
        rejected_documents=rejected_docs
    )

