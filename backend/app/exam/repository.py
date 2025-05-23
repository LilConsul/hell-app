from datetime import datetime, timezone
from typing import Dict, List

from app.core.repository.base_repository import BaseRepository
from app.exam.models import (
    Collection,
    ExamInstance,
    ExamStatus,
    Question,
    StudentAttempt,
    StudentExam,
    StudentExamStatus,
    StudentResponse,
)


class CollectionRepository(BaseRepository[Collection]):
    """Repository for Collection model operations"""

    async def get_published(self) -> List[Collection]:
        """Get all published collections"""
        # Fetch collections with linked objects (created_by user)
        collections = await self.model_class.find(
            {"status": ExamStatus.PUBLISHED}
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

    async def create_response(
        self, attempt: StudentAttempt, question, option_order: Dict[str, int]
    ) -> None:
        """Create a single student response for a question in an attempt."""
        response = StudentResponse(
            attempt_id=attempt,
            question_id=question,
            option_order=option_order,
            selected_option_ids=[],
        )
        await self.create(response.model_dump())

    async def create_responses_for_attempt(
        self,
        attempt: StudentAttempt,
        questions: List,
        option_orders: Dict[str, Dict[str, int]],
    ) -> None:
        """Create response records for all questions in an attempt."""
        for question in questions:
            option_order = option_orders.get(question.id, {})
            await self.create_response(attempt, question, option_order)


class StudentAttemptRepository(BaseRepository[StudentAttempt]):
    """Repository for StudentAttempt model operations"""

    async def create_exam_attempt(
        self, student_exam: StudentExam, question_order: List[str]
    ) -> StudentAttempt:
        """Create a new exam attempt."""
        new_attempt = StudentAttempt(
            student_exam_id=student_exam,
            status=StudentExamStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
            question_order=question_order,
        )
        return await self.create(new_attempt.model_dump())


class StudentExamRepository(BaseRepository[StudentExam]):
    """Repository for StudentExam model operations"""

    async def get_all_by_student(self, student_id: str) -> List[StudentExam]:
        """Get all exams for a student."""
        return await self.model_class.find(
            {"student_id._id": student_id}, fetch_links=True
        ).to_list()

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
