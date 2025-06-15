import uuid
from typing import Dict, List, Optional

from beanie import Delete, Document, Indexed, before_event
from pydantic import ConfigDict, EmailStr, Field

from app.auth.schemas import UserRole
from app.database.mixins import TimestampMixin


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

    @before_event(Delete)
    async def before_delete(self):
        """Trigger cascade deletion of related exam data when a user is deleted"""
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
