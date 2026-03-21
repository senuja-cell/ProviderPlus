from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from ..models.provider_model import Provider
from ..models.user_model import User, UserRole
from ..schemas.provider_schemas import (
    AdminProviderDetailResponse,
    DocumentVerificationRequest
)
from ..core.security import get_current_user
from ..services.gridfs_service import download_document
from fastapi.responses import StreamingResponse
import io


router = APIRouter(prefix="/admin/providers", tags=["Admin - Provider Verification"])

# check if the user is admin
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# GET PENDING PROVIDERS
@router.get("/pending")
async def get_pending_providers(
        current_admin: User = Depends(get_current_admin)
):
    """"
    get all providers pending verification
    returns providers where isverified =  False
    """

    providers = await Provider.find(
        Provider.is_verified == False,
        {"business_documents": {"$exists": True, "$ne": []}}
    ).to_list()

    result = []
    for provider in providers:
        user = await User.find_one(User.id == provider.user_id)
        category =  await provider.category.fetch()

        total_docs = len(provider.business_documents)
        verified_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'verified')
        pending_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'pending')
        rejected_docs = sum(1 for doc in provider.business_documents if doc['status'] == 'rejected')

        result.append({
            "id": str(provider.id),
            "name": provider.name,
            "email": user.email if user else "Unknown",
            "phone_number": provider.phone_number,
            "category": {
                "id": str(category.id),
                "name": category.name,
                "slug": category.slug
            },
            "created_at": provider.created_at,
            "document_status": {
                "total": total_docs,
                "verified": verified_docs,
                "pending": pending_docs,
                "rejected": rejected_docs
            }
        })

    return result



# GET VERIFIED PROVIDERS
@router.get("/verified/list")
async def get_verified_providers(
        current_admin: User = Depends(get_current_admin)
):
    """"
    get all verified providers
    """

    providers = await Provider.find(Provider.is_verified == True).to_list()

    result = []
    for provider in providers:
        user = await User.find_one(User.id == provider.user_id)
        category = await provider.category.fetch()

        result.append({
            "id": str(provider.id),
            "name": provider.name,
            "email": user.email if user else "Unknown",
            "category": category.name if category else "Unknown",
            "rating": provider.rating,
            "total_documents": len(provider.business_documents),
            "created_at": provider.created_at
        })

    return result


# GET PROVIDER DETAILS
@router.get("/{provider_id}", response_model=AdminProviderDetailResponse)
async def get_provider_details(
        provider_id: str,
        current_admin: User =  Depends(get_current_admin)
):
    """
    get detailsed proovider info including all documents
    for admin review  and verification
    """

    provider = await Provider.get(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    user = await User.find_one(User.id == provider.user_id)
    category  = await provider.category.fetch()


    return AdminProviderDetailResponse(
        id=str(provider.id),
        name=provider.name,
        email=user.email if user else "Unknown",
        phone_number=provider.phone_number,
        category={
            "id": str(category.id),
            "name": category.name,
            "slug": category.slug
        },
        description=provider.description,
        profile_image=provider.profile_image,
        portfolio_images=provider.portfolio_images,
        is_verified=provider.is_verified,
        business_documents=provider.business_documents,
        created_at=provider.created_at,
        updated_at=provider.updated_at
    )


# DOWNLOAD DOCUMENT (ADMIN)
@router.get("/{provider_id}/documents/{file_id}")
async def download_provider_document(
        provider_id: str,
        file_id: str,
):
    try:
        content = await download_document(file_id)
        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=document_{file_id}.pdf"  # inline -> attachment
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Document not found")


# VERIFY/REJECT DOCUMENT
@router.put("/{provider_id}/verify-document")
async def verify_provider_document(
        provider_id:  str,
        request:  DocumentVerificationRequest,
        current_admin: User = Depends(get_current_admin)
):
    """"
    verify or reject a specific document
    actions: verify orr reject
    """
    provider = await Provider.get(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if request.document_index >= len(provider.business_documents):
        raise HTTPException(status_code=400, detail="Invalid document index")


    document = provider.business_documents[request.document_index]

    if request.action == "verify":
        document['status'] = 'verified'
        document['verified_at'] = datetime.utcnow()
        document['rejection_reason'] = None
        message = f"Document '{document['filename']}' verified successfully"

    elif request.action == "reject":
        document['status'] = 'rejected'
        document['verified_at'] = None
        document['rejection_reason'] = request.rejection_reason or "Document not acceptable"
        message = f"Document '{document['filename']}' verified successfully"

    else:
        raise HTTPException(status_code=400, detail="Invalid action. use verify or reject")


    provider.updated_at = datetime.utcnow()
    await provider.save()

    return{
        "message": message,
        "document": document
    }


# APPROVE PROVIDER
@router.put("/{provider_id}/approve")
async def approve_provider(
        provider_id: str,
        current_admin: User = Depends(get_current_admin)
):
    """"
    approve provider - sets is verified = True
    requirements:
        all documents must  be verified
        at least one portfolio image uploaded
    """
    provider = await Provider.get(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if not provider.business_documents:
        raise HTTPException(
            status_code=400,
            detail="Provider has no documents uploaded"
        )

    pending_docs = [doc for doc in provider.business_documents if doc['status'] == 'pending']
    rejected_docs = [doc for doc in provider.business_documents if doc['status'] == 'rejected']

    if pending_docs:
        raise HTTPException(
            status_code=400,
            detail=f"{len(pending_docs)} document(s) still pending verification"
        )

    if rejected_docs:
        raise HTTPException(
            status_code=400,
            detail=f"{len(rejected_docs)} document(s) rejected. Provider must reupload."
        )

    if not provider.portfolio_images:
        print(f"Warning: Provider {provider_id} has no portfolio images")

    provider.is_verified = True
    provider.updated_at = datetime.utcnow()
    await provider.save()

    return {
        "message": "Provider approved successfully",
        "provider_id": str(provider.id),
        "is_verified": True
    }


# REJECT PROVIDER
@router.put("/{provider_id}/reject")
async def reject_provider(
        provider_id: str,
        reason: str,
        current_admin: User = Depends(get_current_admin)
):
    """
    reject provider completely
    this keeps is_verified = False  and adds rejection reason
    provider can resubmit  after fixing issues
    """
    provider = await Provider.get(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    for doc in provider.business_documents:
        if doc['status'] == 'pending':
            doc['status'] = 'rejected'
            doc['rejection_reason'] = reason

    provider.is_verified = False
    provider.updated_at = datetime.utcnow()
    await provider.save()

    return {
        "message":  "Provider rejected",
        "provider_id": str(provider_id),
        "reason": reason
    }

