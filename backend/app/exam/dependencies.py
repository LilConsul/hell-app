from app.exam.models import Collection, Question
from app.exam.repository import CollectionRepository, QuestionRepository


def get_question_repository() -> QuestionRepository:
    return QuestionRepository(Question)


def get_collection_repository() -> CollectionRepository:
    return CollectionRepository(Collection)
