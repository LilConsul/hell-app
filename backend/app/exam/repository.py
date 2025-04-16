from typing import List

from app.core.repository.base_repository import BaseRepository
from app.exam.models import Collection, Question


class CollectionRepository(BaseRepository[Collection]):
    """Repository for Collection model operations"""
    async def get_all_questions_by_id(self, collection_id: str)-> List[str] | None:
        """Get all questions from all collections"""
        collection = await self.model_class.find_one(self.model_class.id == collection_id, fetch_links=True)
        if not collection:
            return None
        print(collection)
        return collection.questions


class QuestionRepository(BaseRepository[Question]):
    """Repository for Question model operations"""
    #TODO: MOVE TO COLLECTION REPOSITORY
    async def get_all_by_collection_id(self, collection_id: str) -> List[Question]:
        """Get all questions belonging to a specific collection"""
        collection = await Collection.find_one({"id": collection_id})
        if not collection:
            return []

        # Get all questions referenced in the collection
        question_ids = [str(q.id) for q in collection.questions]
        if not question_ids:
            return []

        return await self.model_class.find({"id": {"$in": question_ids}}).to_list()
