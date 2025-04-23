from typing import List

from app.auth.repository import UserRepository
from app.auth.schemas import UserResponse, UserRole
from app.auth.security import get_password_hash, verify_password
from app.core.exceptions import AuthenticationError, NotFoundError
from app.users.schemas import StudentData, UserUpdate


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_all_students(self) -> List[StudentData]:
        """Get all students"""
        students = await self.user_repository.get_all_by_role(UserRole.STUDENT)
        if not students:
            return []
        return [StudentData.model_validate(student) for student in students]

    async def get_user_info(self, user_id: str) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)

        if not user:
            raise NotFoundError("User not found")

        return UserResponse.model_validate(user)

    async def update_user_info(
        self, user_id: str, user_data: UserUpdate
    ) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        update_data = {}
        if user_data.first_name is not None:
            update_data["first_name"] = user_data.first_name
        if user_data.last_name is not None:
            update_data["last_name"] = user_data.last_name

        updated_user = await self.user_repository.update(user_id, update_data)
        return UserResponse.model_validate(updated_user)

    async def delete_user_info(self, user_id: str) -> None:
        success = await self.user_repository.delete(user_id)
        if not success:
            raise NotFoundError("User not found")

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if not verify_password(old_password, user.hashed_password):
            raise AuthenticationError("Invalid password")

        await self.user_repository.update(
            user_id, {"hashed_password": get_password_hash(new_password)}
        )
