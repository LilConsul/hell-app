from typing import List, Optional

from app.auth.models import User
from app.auth.schemas import UserRole
from app.core.repository.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        return await self.model_class.find_one(self.model_class.email == email)

    async def get_all_by_role(self, role: UserRole) -> Optional[List[User]]:
        """Get a user by role"""
        return await self.model_class.find(self.model_class.role == role).to_list()
