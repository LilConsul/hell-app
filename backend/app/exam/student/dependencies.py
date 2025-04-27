from app.exam.dependencies import (
    get_student_attempt_repository,
    get_student_exam_repository,
    get_student_response_repository,
)
from app.exam.repository import (
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)
from app.exam.student.services import StudentExamService
from fastapi import Depends


def get_student_exam_service(
    student_exam_repository: StudentExamRepository = Depends(
        get_student_exam_repository
    ),
    student_attempt_repository: StudentAttemptRepository = Depends(get_student_attempt_repository),
    student_response_repository: StudentResponseRepository = Depends(get_student_response_repository),
) -> StudentExamService:
    return StudentExamService(student_exam_repository, student_attempt_repository, student_response_repository)