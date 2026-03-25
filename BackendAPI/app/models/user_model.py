from beanie import Document, Indexed
from pydantic import Field, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    CUSTOMER = "customer"
    PROVIDER = "provider"
    ADMIN = "admin"

class User(Document):
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    full_name: str
    phone_number: Optional[str] = None
    birthday: Optional[str] = None
    gender: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    provider_profile_id: Optional[str] = None

    class Settings:
        name = "users"
