import uuid
from typing import Dict, List, Optional

from app.auth.schemas import UserRole
from app.database.mixins import TimestampMixin
from beanie import Delete, Document, Indexed, Link, before_event
from pydantic import ConfigDict, EmailStr, Field


class User(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_verified: bool = False
    role: UserRole = UserRole.STUDENT
    receive_notifications: bool = True
    notifications_tasks_id: Dict[str, List[str]] = Field(default_factory=dict)

    # Add a back-reference to social connections
    # social_connections: List[BackLink["SocialConnection"]] = Field(
    #     default_factory=list,
    #     json_schema_extra={
    #         "original_field": "user",
    #     },
    # )

    @before_event(Delete)
    async def before_delete(self):
        """Trigger cascade deletion of related exam data when a user is deleted"""
        # FIXME: Uncomment this line when SocialConnection is defined
        # from app.auth.models import SocialConnection
        # await SocialConnection.find(SocialConnection.user.id == self.id).delete()

        from app.exam.models import cascade_delete_user

        await cascade_delete_user(self.id, self.role)

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

    class Settings:
        name = "social_connections"
        indexes = [
            "provider_user_id",
            ("provider", "provider_user_id"),  # Compound index
        ]
