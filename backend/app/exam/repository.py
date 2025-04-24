from typing import List

from app.core.repository.base_repository import BaseRepository
from app.exam.models import Collection, ExamInstance, ExamStatus, Question


class CollectionRepository(BaseRepository[Collection]):
    """Repository for Collection model operations"""

    async def get_by_creator(self, user_id: str) -> List[Collection]:
        """Get all collections created by a specific user ID"""
        collections = await self.model_class.find(
            {"created_by._id": user_id},
            fetch_links=True,
        ).to_list()

        return collections

    async def get_published(self) -> List[Collection]:
        """Get all published collections"""
        # Fetch collections with linked objects (created_by user)
        collections = await self.model_class.find(
            {"status": ExamStatus.PUBLISHED},
            fetch_links=True,
        ).to_list()

        for collection in collections:
            if hasattr(collection.created_by, "notifications_tasks_id"):
                collection.created_by.notifications_tasks_id = []
        return collections

class QuestionRepository(BaseRepository[Question]):
    """Repository for Question model operations"""

    pass


class ExamInstanceRepository(BaseRepository[ExamInstance]):
    """Repository for ExamInstance model operations"""

    pass



