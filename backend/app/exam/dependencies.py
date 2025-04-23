from app.exam.models import Collection, ExamInstance, Question
from app.exam.repository import (
    CollectionRepository,
    ExamInstanceRepository,
    QuestionRepository,
)


def get_question_repository() -> QuestionRepository:
    return QuestionRepository(Question)


def get_collection_repository() -> CollectionRepository:
    return CollectionRepository(Collection)


def get_exam_instance_repository() -> ExamInstanceRepository:
    return ExamInstanceRepository(ExamInstance)
