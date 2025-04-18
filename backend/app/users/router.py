from typing import List

from fastapi import APIRouter, Depends
from app.auth.dependencies import (
    get_current_teacher_id,
)
from app.core.schemas import BaseReturn
from app.users.dependencies import get_user_service
from app.users.schemas import StudentData

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_current_teacher_id)]
)


@router.get("/students")
async def get_student_mails(
    user_service=Depends(get_user_service),
) -> BaseReturn[List[StudentData]]:
    """
    As a teacher get all student emails.
    """
    students = await user_service.get_all_students()
    return BaseReturn(
        message="Students retrieved successfully",
        data=students,
    )
