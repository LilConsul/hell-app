from typing import List

from app.auth.dependencies import get_current_student_id
from app.exam.student.dependencies import get_student_exam_service
from app.exam.student.services import StudentExamService
from fastapi import APIRouter, Depends

from ...core.schemas import BaseReturn
from .schemas import (
    BaseGetStudentExamSchema,
    CurrentAttemptSchema,
    DetailGetStudentExamSchema,
    QuestionAnswer,
    QuestionForStudent,
)

router = APIRouter(
    prefix="/student",
    tags=["exam/student"],
    dependencies=[Depends(get_current_student_id)],
)


@router.get("/exams", response_model=BaseReturn[List[BaseGetStudentExamSchema]])
async def get_student_exams(
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    """
    Get all exams for a student.
    """
    data = await student_exam_service.get_student_exams(student_id)
    return {
        "message": "Exams retrieved successfully",
        "data": data,
    }


@router.get(
    "/exams/{user_exam_id}", response_model=BaseReturn[DetailGetStudentExamSchema]
)
async def get_student_exam(
    user_exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    """
    Get a specific exam for a student.
    """
    data = await student_exam_service.get_student_exam(student_id, user_exam_id)
    return {
        "message": "Exam retrieved successfully",
        "data": data,
    }


@router.get(
    "/exam/{attempt_id}",
    response_model=BaseReturn[CurrentAttemptSchema],
)
async def get_student_attempt(
    attempt_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    """
    Get a specific attempt for a student.
    """
    data = await student_exam_service.get_student_attempt(student_id, attempt_id)
    return {
        "message": "Attempt retrieved successfully",
        "data": data,
    }


@router.post(
    "/exam/{exam_id}/start", response_model=BaseReturn[List[QuestionForStudent]]
)
async def start_exam(
    exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    data = await student_exam_service.start_exam(student_id, exam_id)
    return {
        "message": "Exam started successfully",
        "data": data,
    }


@router.put("/exam/{exam_id}/save_answer", response_model=BaseReturn[None])
async def save_answer(
    exam_id: str,
    question: QuestionAnswer,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    await student_exam_service.save_answer(student_id, exam_id, question)
    return {
        "message": "Answer saved successfully",
    }
