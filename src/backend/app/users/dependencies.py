from fastapi import Depends

from app.auth.dependencies import get_user_repository
from app.auth.repository import UserRepository
from app.storage.dependencies import get_storage_service
from app.storage.service import StorageService
from app.users.services import UserService


def get_user_service(
    user_repository: UserRepository = Depends(get_user_repository),
    storage_service: StorageService = Depends(get_storage_service),
) -> UserService:
    """Get user service"""
    return UserService(user_repository=user_repository, storage_service=storage_service)
