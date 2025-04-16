from fastapi import Depends

from app.exam.dependencies import get_collection_repository, get_question_repository
from app.exam.repository import CollectionRepository, QuestionRepository
from app.exam.teacher.services import CollectionService


def get_collection_service(
    collection_repository: CollectionRepository = Depends(get_collection_repository),
    question_repository: QuestionRepository = Depends(get_question_repository),
) -> CollectionService:
    return CollectionService(collection_repository, question_repository)
