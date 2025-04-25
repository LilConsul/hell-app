from typing import List

from app.auth.dependencies import get_current_student_id
from app.exam.student.dependencies import get_student_exam_service
from app.exam.student.services import StudentExamService
from fastapi import APIRouter, Depends

from .schemas import BaseStudentExamSchema

router = APIRouter(
    prefix="/student",
    tags=["exam/student"],
    dependencies=[Depends(get_current_student_id)],
)


@router.get("/exams")
async def get_student_exams(
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
) -> List[BaseStudentExamSchema]:
    """
    Get all exams for a student.
    """
    return await student_exam_service.get_student_exams(student_id)


@router.get("/exams/{exam_id}")
async def get_student_exam(
    exam_id: str,
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
) -> BaseStudentExamSchema:
    """
    Get a specific exam for a student.
    """
    return await student_exam_service.get_student_exam(exam_id)
