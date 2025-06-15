from typing import List

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_teacher_id, get_current_user_id
from app.auth.schemas import Token, UserResponse
from app.core.schemas import BaseReturn
from app.i18n import _
from app.users.dependencies import get_user_service
from app.users.schemas import StudentData, UserUpdate, UserUpdatePassword

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me", response_model=BaseReturn[UserResponse], response_model_exclude_none=True
)
async def get_user_info(
    user_id: str = Depends(get_current_user_id), user_service=Depends(get_user_service)
):
    """
    Get information about the currently logged-in user
    """
    data = await user_service.get_user_info(user_id)
    return BaseReturn(message=_("User info retrieved successfully"), data=data)


@router.put(
    "/me", response_model=BaseReturn[UserResponse], response_model_exclude_none=True
)
async def update_user_info(
    user_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    user_service=Depends(get_user_service),
):
    """
    Update information about the currently logged-in user
    """
    data = await user_service.update_user_info(user_id, user_data)
    return BaseReturn(
        message=_("User info updated successfully"),
        data=data,
    )


@router.post(
    "/me/request-delete", response_model=BaseReturn, response_model_exclude_none=True
)
async def request_delete_user_info(
    user_id: str = Depends(get_current_user_id),
    user_service=Depends(get_user_service),
):
    """
    Email the user to delete their account
    """
    await user_service.request_delete_user_info(user_id)
    return BaseReturn(
        message=_("User deletion requested successfully"),
    )


@router.delete("/me", response_model=BaseReturn, response_model_exclude_none=True)
async def delete_user_info(
    token: Token,
    user_id: str = Depends(get_current_user_id),
    user_service=Depends(get_user_service),
):
    """
    Delete user account with token confirmation
    """
    await user_service.delete_user_info(user_id, token.token)
    return BaseReturn(
        message=_("User deleted successfully"),
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
    """
    Change the password of the currently logged-in user
    """
    await user_service.change_password(
        user_id, password_data.password, password_data.new_password
    )
    return BaseReturn(
        message=_("Password changed successfully"),
    )


@router.get(
    "/fetch-students",
    response_model=BaseReturn[List[StudentData]],
    response_model_exclude_none=True,
)
async def get_student_mails(
    teacher_id=Depends(get_current_teacher_id),
    user_service=Depends(get_user_service),
):
    """
    As a teacher get all student emails as a teacher.
    """
    students = await user_service.get_all_students()
    return BaseReturn(
        message=_("Students retrieved successfully"),
        data=students,
    )
