from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserUpdatePassword(BaseModel):
    password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    receive_notifications: bool | None = None


class StudentData(BaseModel):
    id: str

    first_name: str
    last_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
