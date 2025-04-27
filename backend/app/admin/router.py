from typing import List

from fastapi import APIRouter
from fastapi.params import Depends

from app.admin.dependencies import get_admin_service
from app.admin.service import AdminService
from app.auth.dependencies import get_current_admin_id
from app.auth.schemas import UserRole
from app.core.schemas import BaseReturn
from app.admin.schemas import UserSchema

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin_id)]
)


@router.get(
    "/users",
    response_model=BaseReturn[List[UserSchema]],
    response_model_exclude_none=True,
)
async def get_users(
    admin_id: str = Depends(get_current_admin_id),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Get all users
    """
    users = await admin_service.get_all_users(admin_id)
    return BaseReturn(message="Users retrieved successfully", data=users)


@router.post(
    "/users/change-role",
    response_model=BaseReturn[UserSchema],
    response_model_exclude_none=True,
)
async def change_user_role(
    user_id: str,
    role: UserRole,
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Change user role
    """
    user = await admin_service.change_user_role(user_id, role)
    return BaseReturn(message="User role changed successfully", data=user)


@router.delete(
    "/users/{user_id}",
    response_model=BaseReturn[UserSchema],
    response_model_exclude_none=True,
)
async def delete_user(
    user_id: str,
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Delete user
    """
    user = await admin_service.delete_user(user_id)
    return BaseReturn(message="User deleted successfully", data=user)


@router.post(
    "/users/{user_id}/verify",
    response_model=BaseReturn[UserSchema],
    response_model_exclude_none=True,
)
async def change_verification(
    user_id: str,
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Verify user
    """
    user = await admin_service.change_verify(user_id)
    return BaseReturn(message="User verified successfully", data=user)
