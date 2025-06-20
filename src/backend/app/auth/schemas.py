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

    model_config = ConfigDict(
        from_attributes=True,
    )


class Token(BaseModel):
    token: str


class EmailRequest(BaseModel):
    email: EmailStr


class AuthReturn(BaseReturn):
    """Schema for auth responses"""

    data: UserResponse | None = None
