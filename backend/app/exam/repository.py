from typing import List

from app.core.repository.base_repository import BaseRepository
from app.exam.models import Collection, Question


class CollectionRepository(BaseRepository[Collection]):
    """Repository for Collection model operations"""

    pass


class QuestionRepository(BaseRepository[Question]):
    """Repository for Question model operations"""

    pass
