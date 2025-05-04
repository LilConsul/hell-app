from typing import List, Union

from app.auth.dependencies import get_current_student_id
from app.core.schemas import BaseReturn
from app.exam.student.dependencies import get_student_exam_service
from app.exam.student.schemas import (
    AnswerSubmission,
    QuestionIdentifier,
    QuestionWithOptions,
    QuestionWithUserResponse,
    ReviewAttempt,
    StudentAttemptBasic,
    StudentExamBase,
    StudentExamDetail,
)
from app.exam.student.services import StudentExamService
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/student",
    tags=["exam/student"],
    dependencies=[Depends(get_current_student_id)],
)


@router.get("/exams", response_model=BaseReturn[List[StudentExamBase]])
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


@router.get("/exams/{student_exam_id}", response_model=BaseReturn[StudentExamDetail])
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
    response_model=BaseReturn[Union[ReviewAttempt, StudentAttemptBasic]],
)
async def get_student_attempt(
    attempt_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    """
    Get a specific attempt for a student.
    If allow_review is true, includes detailed information about correct answers.
    Otherwise returns basic attempt info without correct answers.
    """
    data = await student_exam_service.get_student_attempt(student_id, attempt_id)
    return {
        "message": "Attempt retrieved successfully",
        "data": data,
    }


@router.post(
    "/exam/{student_exam_id}/start",
    response_model=BaseReturn[List[QuestionWithOptions]],
)
async def start_exam(
    student_exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    data = await student_exam_service.start_exam(student_id, student_exam_id)
    return {
        "message": "Exam started successfully",
        "data": data,
    }


@router.put("/exam/{student_exam_id}/save_answer", response_model=BaseReturn[None])
async def save_answer(
    student_exam_id: str,
    question: AnswerSubmission,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    await student_exam_service.save_answer(student_id, student_exam_id, question)
    return {
        "message": "Answer saved successfully",
    }


@router.put(
    "/exam/{student_exam_id}/toggle_flag_question", response_model=BaseReturn[None]
)
async def toggle_flag_question(
    student_exam_id: str,
    question: QuestionIdentifier,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    await student_exam_service.toggle_flag_question(
        student_id, student_exam_id, question.question_id
    )
    return {
        "message": "Question flagged successfully",
    }


@router.get(
    "/exam/{student_exam_id}/reload",
    response_model=BaseReturn[List[QuestionWithUserResponse]],
)
async def reload_exam(
    student_exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    data = await student_exam_service.reload_exam(student_id, student_exam_id)
    return {
        "message": "Exam reloaded successfully",
        "data": data,
    }


@router.post(
    "/exam/{student_exam_id}/submit", response_model=BaseReturn[StudentAttemptBasic]
)
async def submit_exam(
    student_exam_id: str,
    student_id: str = Depends(get_current_student_id),
    student_exam_service: StudentExamService = Depends(get_student_exam_service),
):
    data = await student_exam_service.submit_exam(student_id, student_exam_id)
    return {
        "message": "Exam submitted successfully",
        "data": data,
    }
