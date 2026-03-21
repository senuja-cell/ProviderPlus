from fastapi import APIRouter, HTTPException, status, Depends
from ..core.security import get_current_user, get_current_active_user
from ..schemas.auth_schemas import (
    UserSignupRequest, LoginRequest, TokenResponse,
    GoogleLoginRequest, UpdateProfileRequest, UserProfileResponse
)
from ..services import auth_service
from ..models.user_model import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignupRequest):
    """
    1. Checks if email exists
    2. hashes password
    3. saves user
    4. returns a login token immediately
    """
    result = await auth_service.register_new_user(user_data)
    return result


@router.post("/login")
async def login(login_data: LoginRequest):
    """
    1. verifies email and password
    2. returns a JWT token if valid
    """
    result = await auth_service.authenticate_user(
        email=str(login_data.email),
        password=login_data.password
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return result


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the current logged in user's profile
    """
    return await auth_service.get_user_profile(current_user)


@router.put("/me")
async def update_my_profile(
    update_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile
    Only updates fields that are provided
    """
    result = await auth_service.update_user_profile(
        user=current_user,
        update_data=update_data.model_dump(exclude_none=True)
    )
    return result


@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "user_name": current_user.full_name
    }


@router.post("/google-login")
async def google_login_endpoint(google_data: GoogleLoginRequest):
    """
    google signing endpoint
    1. receives google ID token from the frontend
    2. verifies token with Google
    3. checks if user exists by email
    4. if exists, login
    5. if new, create account
    6. return a JWT token
    """
    result = await auth_service.google_login(google_data.id_token)
    return result