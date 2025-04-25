from app.exam.dependencies import get_student_exam_repository
from app.exam.repository import StudentExamRepository
from app.exam.student.services import StudentExamService
from fastapi import Depends


def get_student_exam_service(
    student_exam_repository: StudentExamRepository = Depends(
        get_student_exam_repository
    ),
) -> StudentExamService:
    return StudentExamService(student_exam_repository)