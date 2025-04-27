from typing import List

from app.auth.dependencies import get_current_student_id
from app.exam.student.dependencies import get_student_exam_service
from app.exam.student.services import StudentExamService
from fastapi import APIRouter, Depends

from ...core.schemas import BaseReturn
from .schemas import (
    BaseGetStudentExamSchema,
    BaseQuestionSchema,
    CurrentAttemptSchema,
    DetailGetStudentExamSchema,
    QuestionBaseSchema,
    QuestionSetAnswer,
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
    "/exams/{student_exam_id}", response_model=BaseReturn[DetailGetStudentExamSchema]
)
async def get_student_exam(
    student_exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    """
    Get a specific exam for a student.
    """
    data = await student_exam_service.get_student_exam(student_id, student_exam_id)
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
    "/exam/{student_exam_id}/start", response_model=BaseReturn[List[BaseQuestionSchema]]
)
async def start_exam(
    student_exam_id: str,
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    data = await student_exam_service.start_exam(student_exam_id)
    return {
        "message": "Exam started successfully",
        "data": data,
    }


@router.put("/exam/{student_exam_id}/save_answer", response_model=BaseReturn[None])
async def save_answer(
    student_exam_id: str,
    question: QuestionSetAnswer,
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    await student_exam_service.save_answer(student_exam_id, question)
    return {
        "message": "Answer saved successfully",
    }


@router.put("/exam/{student_exam_id}/flag_question", response_model=BaseReturn[None])
async def flag_question(
    student_exam_id: str,
    question: QuestionBaseSchema,
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    await student_exam_service.flag_question(student_exam_id, question.question_id)
    return {
        "message": "Question flagged successfully",
    }
