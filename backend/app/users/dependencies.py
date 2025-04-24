from app.auth.dependencies import get_user_repository
from app.auth.repository import UserRepository
from app.users.services import UserService
from fastapi import Depends


def get_user_service(
    user_repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    """Get user service"""
    return UserService(user_repository=user_repository)
