from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.user_model import UserRole

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    role: UserRole = UserRole.CUSTOMER

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    user_name: str
    is_new_user: bool = False

class GoogleLoginRequest(BaseModel):
    id_token: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    birthday: Optional[str] = None
    gender: Optional[str] = None

class UserProfileResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    phone_number: Optional[str] = None
    birthday: Optional[str] = None
    gender: Optional[str] = None
    role: str