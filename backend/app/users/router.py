from typing import List

from app.auth.dependencies import (
    get_current_teacher_id,
    get_current_user_id,
)
from app.auth.schemas import UserResponse
from app.core.schemas import BaseReturn
from app.users.dependencies import get_user_service
from app.users.schemas import StudentData, UserUpdate, UserUpdatePassword
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me", response_model=BaseReturn[UserResponse], response_model_exclude_none=True
)
async def get_user_info(
    user_id: str = Depends(get_current_user_id), user_service=Depends(get_user_service)
):
    """Get information about the currently logged in user"""
    data = await user_service.get_user_info(user_id)
    return BaseReturn(message="User info retrieved successfully", data=data)


@router.put(
    "/me", response_model=BaseReturn[UserResponse], response_model_exclude_none=True
)
async def update_user_info(
    user_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    user_service=Depends(get_user_service),
):
    """Update information about the currently logged in user"""
    data = await user_service.update_user_info(user_id, user_data)
    return BaseReturn(
        message="User info updated successfully",
        data=data,
    )


@router.delete("/me", response_model=BaseReturn, response_model_exclude_none=True)
async def delete_user_info(
    user_id: str = Depends(get_current_user_id), user_service=Depends(get_user_service)
):
    """Delete the currently logged in user"""
    await user_service.delete_user_info(user_id)
    return BaseReturn(
        message="User deleted successfully",
    )


@router.put(
    "/me/change-password",
    response_model=BaseReturn,
    response_model_exclude_none=True,
)
async def change_password(
    password_data: UserUpdatePassword,
    user_id: str = Depends(get_current_user_id),
    user_service=Depends(get_user_service),
):
    """Change the password of the currently logged in user"""
    await user_service.change_password(
        user_id, password_data.password, password_data.new_password
    )
    return BaseReturn(
        message="Password changed successfully",
    )


@router.get("/fetch-students")
async def get_student_mails(
    teacher_id=Depends(get_current_teacher_id),
    user_service=Depends(get_user_service),
) -> BaseReturn[List[StudentData]]:
    """
    As a teacher get all student emails as a teacher.
    """
    students = await user_service.get_all_students()
    return BaseReturn(
        message="Students retrieved successfully",
        data=students,
    )
