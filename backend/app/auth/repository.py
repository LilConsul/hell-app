from typing import Optional

from app.auth.models import User
from app.core.repository.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        return await self.model_class.find_one(self.model_class.email == email)
