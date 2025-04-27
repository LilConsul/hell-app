from typing import Optional, List, Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.auth.models import User
from contextlib import contextmanager


class UserUpdatePassword(BaseModel):
    password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    receive_notifications: bool | None = None


class UserSchema(User):
    hashed_password: Any = Field(exclude=True)
    notifications_tasks_id: Any = Field(exclude=True)

    model_config = ConfigDict(from_attributes=True)


class StudentData(BaseModel):
    id: str

    first_name: str
    last_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
