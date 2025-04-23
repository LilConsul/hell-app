from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.schemas import BaseReturn


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResetPassword(BaseModel):
    password: str = Field(..., min_length=8)
    token: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole

    model_config = ConfigDict(
        from_attributes=True,
    )


class Token(BaseModel):
    token: str


class EmailRequest(BaseModel):
    email: EmailStr


class OAuthRequest(BaseModel):
    """Schema for OAuth authorization code flow"""

    code: str
    redirect_uri: str = None
    state: str = None


class SocialAccount(BaseModel):
    """Schema for social account connection"""

    provider: str
    provider_user_id: str
    email: str


class AuthReturn(BaseReturn):
    """Schema for auth responses"""

    data: UserResponse | None = None
