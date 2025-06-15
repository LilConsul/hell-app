from typing import Any

from pydantic import ConfigDict, Field

from app.auth.models import User


class UserSchema(User):
    id: Any = Field(..., alias="_id", serialization_alias="id")
    hashed_password: Any = Field(exclude=True)
    notifications_tasks_id: Any = Field(exclude=True)

    model_config = ConfigDict(from_attributes=True)
