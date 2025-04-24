from app.exam.models import (
    Collection,
    ExamInstance,
    Question,
    StudentAttempt,
    StudentExam,
    StudentResponse,
)
from app.exam.repository import (
    CollectionRepository,
    ExamInstanceRepository,
    QuestionRepository,
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)


def get_question_repository() -> QuestionRepository:
    return QuestionRepository(Question)


def get_collection_repository() -> CollectionRepository:
    return CollectionRepository(Collection)


def get_exam_instance_repository() -> ExamInstanceRepository:
    return ExamInstanceRepository(ExamInstance)


def get_student_response_repository() -> StudentResponseRepository:
    return StudentResponseRepository(StudentResponse)


def get_student_attempt_repository() -> StudentAttemptRepository:
    return StudentAttemptRepository(StudentAttempt)


def get_student_exam_repository() -> StudentExamRepository:
    return StudentExamRepository(StudentExam)