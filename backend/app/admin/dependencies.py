from fastapi import Depends

from app.admin.service import AdminService
from app.auth.dependencies import get_user_repository
from app.auth.repository import UserRepository


def get_admin_service(
    user_repository: UserRepository = Depends(get_user_repository),
):
    return AdminService(
        user_repository=user_repository,
    )
