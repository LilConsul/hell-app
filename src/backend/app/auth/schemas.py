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


class UserLogin(UserBase):
    password: str
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "stringst",
            }
        },
    )


class UserResponse(UserBase):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    receive_notifications: bool
    profile_picture_url: Optional[str] = None
    mfa_enabled: bool = False

    model_config = ConfigDict(
        from_attributes=True,
    )


class Token(BaseModel):
    token: str


class EmailRequest(BaseModel):
    email: EmailStr


class MFASetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    #Just render it — no decoding needed
    #<img src={qrCodeUrl} alt="Scan with your authenticator app" />

class MFASetupReturn(BaseReturn):
    data: MFASetupResponse

class MFAVerify(BaseModel):
    code: str #don't ask why it's string when it's int, idk the totp.verify method accepts string :_


class MFALoginVerify(BaseModel):
    mfa_token: str
    mfa_code: str


class MFALoginChallenge(BaseModel):
    mfa_required: bool = True
    mfa_token: str


class MobileLoginToken(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int


class MobileLoginReturn(BaseModel):
    data: MobileLoginToken | MFALoginChallenge

class AuthReturn(BaseReturn):
    """Schema for auth responses"""

    data: UserResponse | MFALoginChallenge | None = None
