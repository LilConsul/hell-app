import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from app.database.mixins import TimestampMixin
from beanie import BackLink, Document, Indexed, Link
from pydantic import ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_verified: bool = False
    role: UserRole = UserRole.STUDENT

    # Add a back-reference to social connections
    social_connections: List[BackLink["SocialConnection"]] = Field(
        default_factory=list,
        json_schema_extra={
            "original_field": "user",
        },
    )

    class Settings:
        name = "users"
        use_state_management = True

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "is_verified": True,
                "role": "student",
                "created_at": "2023-01-01T00:00:00.000Z",
                "updated_at": "2023-01-01T00:00:00.000Z",
            }
        }
    )


class SocialConnection(Document, TimestampMixin):
    """Model to track social login connections"""

    provider: str  # "google", "github", etc.
    provider_user_id: str
    # Change from string to Link for proper relationship
    user: Link[User]
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "social_connections"
        indexes = [
            "provider_user_id",
            ("provider", "provider_user_id"),  # Compound index
        ]
