from fastapi import Depends
from app.exam.models import Question, Collection
from app.exam.repository import QuestionRepository, CollectionRepository
from app.exam.teacher.services import CollectionService


def get_question_repository() -> QuestionRepository:
    return QuestionRepository(Question)


def get_collection_repository() -> CollectionRepository:
    return CollectionRepository(Collection)


def get_collection_service(
    collection_repository: CollectionRepository = Depends(get_collection_repository),
    question_repository: QuestionRepository = Depends(get_question_repository),
) -> CollectionService:
    return CollectionService(collection_repository, question_repository)
