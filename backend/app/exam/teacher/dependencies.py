from fastapi import Depends

from app.exam.dependencies import (
    get_collection_repository,
    get_question_repository,
    get_exam_instance_repository,
)
from app.exam.repository import (
    CollectionRepository,
    QuestionRepository,
    ExamInstanceRepository,
)
from app.exam.teacher.services import CollectionService, ExamInstanceService


def get_collection_service(
    collection_repository: CollectionRepository = Depends(get_collection_repository),
    question_repository: QuestionRepository = Depends(get_question_repository),
) -> CollectionService:
    return CollectionService(collection_repository, question_repository)


def get_exam_instance_service(
    exam_ins_repo: ExamInstanceRepository = Depends(get_exam_instance_repository),
    collection_repo: CollectionRepository = Depends(get_collection_repository),
) -> ExamInstanceService:
    return ExamInstanceService(exam_ins_repo, collection_repo)
