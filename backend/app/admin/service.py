from typing import List

from app.auth.repository import UserRepository
from app.auth.schemas import UserRole
from app.admin.schemas import UserSchema
from app.core.exceptions import NotFoundError


class AdminService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_all_users(self, admin_id) -> List[UserSchema]:
        users = await self.user_repository.get_all()
        return [
            UserSchema.model_validate(user) for user in users if user.id != admin_id
        ]

    async def change_user_role(self, user_id: str, role: UserRole) -> UserSchema:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        user.role = role
        await self.user_repository.save(user)
        return UserSchema.model_validate(user)

    async def delete_user(self, user_id: str) -> UserSchema:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        await self.user_repository.delete(user_id)
        return UserSchema.model_validate(user)

    async def change_verify(self, user_id: str) -> UserSchema:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        user.is_verified = True
        await self.user_repository.update(user_id, dict(user))
        return UserSchema.model_validate(user)
