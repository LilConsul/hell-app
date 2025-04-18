from typing import List

from app.auth.repository import UserRepository
from app.auth.schemas import UserRole
from app.users.schemas import StudentData


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_all_students(self) -> List[StudentData]:
        """Get all students"""
        students = await self.user_repository.get_all_by_role(UserRole.STUDENT)
        if not students:
            return []
        return [StudentData.model_validate(student) for student in students]
