from app.auth.dependencies import get_user_repository
from app.auth.repository import UserRepository
from app.exam.dependencies import (
    get_collection_repository,
    get_exam_instance_repository,
    get_question_repository,
    get_student_attempt_repository,
    get_student_exam_repository,
)
from app.exam.repository import (
    CollectionRepository,
    ExamInstanceRepository,
    QuestionRepository,
    StudentAttemptRepository,
    StudentExamRepository,
)
from app.exam.teacher.services import (
    CollectionService,
    ExamInstanceService,
    ReportService,
)
from fastapi import Depends


def get_collection_service(
    collection_repository: CollectionRepository = Depends(get_collection_repository),
    question_repository: QuestionRepository = Depends(get_question_repository),
) -> CollectionService:
    return CollectionService(collection_repository, question_repository)


def get_exam_instance_service(
    exam_ins_repo: ExamInstanceRepository = Depends(get_exam_instance_repository),
    collection_repo: CollectionRepository = Depends(get_collection_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    student_exam_repo: StudentExamRepository = Depends(get_student_exam_repository),
) -> ExamInstanceService:
    return ExamInstanceService(
        exam_ins_repo, collection_repo, user_repository, student_exam_repo
    )


def get_report_service(
    student_exam_repository: StudentExamRepository = Depends(
        get_student_exam_repository
    ),
    exam_instance_repository: ExamInstanceRepository = Depends(
        get_exam_instance_repository
    ),
    student_attempt_repository: StudentAttemptRepository = Depends(
        get_student_attempt_repository
    ),
) -> ReportService:
    return ReportService(
        student_exam_repository, student_attempt_repository, exam_instance_repository
    )
