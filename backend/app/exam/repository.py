from typing import List

from app.core.repository.base_repository import BaseRepository
from app.exam.models import (
    Collection,
    ExamInstance,
    ExamStatus,
    Question,
    StudentAttempt,
    StudentExam,
    StudentResponse,
)


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


class StudentResponseRepository(BaseRepository[StudentResponse]):
    """Repository for StudentResponse model operations"""

    pass


class StudentAttemptRepository(BaseRepository[StudentAttempt]):
    """Repository for StudentAttempt model operations"""

    pass


class StudentExamRepository(BaseRepository[StudentExam]):
    """Repository for StudentExam model operations"""

    async def get_by_student_and_exam(
        self, student_id: str, exam_id: str, fetch_links: bool = False
    ) -> StudentExam | None:
        """Get a StudentExam record for a specific student and exam"""
        student_exam = await self.model_class.find_one(
            self.model_class.student_id.id == student_id,
            self.model_class.exam_instance_id.id == exam_id,
            fetch_links=fetch_links,
        )
        return student_exam


