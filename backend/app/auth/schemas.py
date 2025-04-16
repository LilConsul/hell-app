from typing import Optional

from app.schemas import BaseReturn
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserUpdatePassword(BaseModel):
    password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class UserResetPassword(BaseModel):
    password: str = Field(..., min_length=8)
    token: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


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
