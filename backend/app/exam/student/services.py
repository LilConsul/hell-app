import random
from datetime import datetime, timezone
from typing import List

from app.core.exceptions import ForbiddenError
from app.exam.models import QuestionType, StudentExamStatus
from app.exam.repository import (
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)
from app.exam.student.schemas import (
    BaseGetStudentExamSchema,
    BaseQuestionOptionSchema,
    BaseQuestionSchema,
    CurrentAttemptSchema,
    DetailGetStudentExamSchema,
    QuestionSetAnswer,
    StudentResponseSchema,
)


class StudentExamService:
    def __init__(
        self,
        student_exam_repository: StudentExamRepository,
        student_attempt_repository: StudentAttemptRepository,
        student_response_repository: StudentResponseRepository,
    ):
        self.student_exam_repository = student_exam_repository
        self.student_attempt_repository = student_attempt_repository
        self.student_response_repository = student_response_repository

    async def get_student_exams(
        self, student_id: str
    ) -> List[BaseGetStudentExamSchema]:
        """
        Get all exams for a student.
        """
        data = await self.student_exam_repository.get_all(
            {"student_id._id": student_id}, fetch_links=True
        )
        if not data:
            return []
        return [
            BaseGetStudentExamSchema.model_validate(
                {
                    **exam.model_dump(),
                    "exam_instance_id": exam.exam_instance_id.model_dump(),
                }
            )
            for exam in data
        ]

    async def get_student_exam(
        self, student_id: str, student_exam_id: str
    ) -> DetailGetStudentExamSchema:
        """
        Get a specific exam for a student.
        """
        data = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_links=True
        )
        if not data:
            raise ForbiddenError("Exam not found")

        if data.student_id.id != student_id:
            raise ForbiddenError("You do not have permission to access this exam")
        print(data.attempts)

        # Create exam dictionary with basic fields
        exam_dict = {
            "id": data.id,
            "exam_instance_id": data.exam_instance_id.model_dump(),
            "current_status": data.current_status,
            "attempts_count": data.attempts_count,
            "attempts": [],
            "last_attempt": None,
        }

        # Process attempts
        if hasattr(data, "attempts") and data.attempts:
            for attempt in data.attempts:
                attempt_dict = {
                    "id": attempt.id,
                    "status": attempt.status,
                    "started_at": attempt.started_at,
                    "submitted_at": attempt.submitted_at,
                    "grade": attempt.grade,
                    "pass_fail": attempt.pass_fail,
                    "graded_at": attempt.graded_at,
                    "question_order": attempt.question_order,
                    "security_events": attempt.security_events,
                    "responses": [],
                }

                exam_dict["attempts"].append(attempt_dict)

                # Set as last_attempt if this is the latest attempt
                if data.latest_attempt_id:
                    latest_id = (
                        data.latest_attempt_id.id
                        if hasattr(data.latest_attempt_id, "id")
                        else str(data.latest_attempt_id)
                    )
                    if attempt.id == latest_id:
                        exam_dict["last_attempt"] = attempt_dict

        return DetailGetStudentExamSchema.model_validate(exam_dict)

    async def get_student_attempt(
        self, student_id: str, attempt_id: str
    ) -> CurrentAttemptSchema:
        """
        Get a specific attempt for a student.
        """
        data = await self.student_attempt_repository.get_by_id(
            attempt_id, fetch_links=True
        )
        if not data:
            raise ForbiddenError("Attempt not found")

        if data.student_exam_id.student_id.id != student_id:
            raise ForbiddenError("You do not have permission to access this attempt")

        # if data.status == StudentExamStatus.IN_PROGRESS:
        #     raise ForbiddenError("Attempt is still in progress")

        attempt_dict = data.model_dump()
        if hasattr(data, "responses") and data.responses:
            attempt_dict["responses"] = [
                StudentResponseSchema.model_validate(response.model_dump())
                for response in data.responses
            ]

        return CurrentAttemptSchema.model_validate(attempt_dict)

    def _validate_exam_time(self, start_date, end_date):
        """Validate if the current time is within the exam time range."""
        # TODO: Validata timezones
        current_time = datetime.now(timezone.utc)
        start_date_aware = start_date.replace(tzinfo=timezone.utc)
        end_date_aware = end_date.replace(tzinfo=timezone.utc)
        if current_time < start_date_aware:
            raise ForbiddenError("Exam is not available yet")
        if current_time > end_date_aware:
            raise ForbiddenError("Exam has already ended")

    async def start_exam(self, student_exam_id: str) -> List[BaseQuestionSchema]:
        """Start an exam for a student."""
        student_exam = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_links=True
        )
        if not student_exam:
            raise ForbiddenError("Exam not found")

        if student_exam.current_status == StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError("Exam already started")

        exam_instance = student_exam.exam_instance_id
        if student_exam.attempts_count >= exam_instance.max_attempts:
            raise ForbiddenError("Max attempts reached")

        self._validate_exam_time(exam_instance.start_date, exam_instance.end_date)

        collection = student_exam.exam_instance_id.collection_id
        questions = collection.questions
        question_ids = [question.id for question in questions]

        should_shuffle = exam_instance.security_settings.shuffle_questions
        if should_shuffle:
            combined = list(zip(question_ids, questions))
            random.shuffle(combined)
            question_ids, questions = zip(*combined) if combined else ([], [])
            question_ids = list(question_ids)
            questions = list(questions)

        attempt = await self.student_attempt_repository.create_exam_attempt(
            student_exam, question_ids
        )

        option_orders = {}
        for question in questions:
            options = question.options
            option_order = {}

            if should_shuffle and options:
                shuffled_indices = list(range(len(options)))
                random.shuffle(shuffled_indices)
                for i, option in enumerate(options):
                    option_order[option.id] = shuffled_indices[i]
            else:
                for i, option in enumerate(options):
                    option_order[option.id] = i

            option_orders[question.id] = option_order

        await self.student_response_repository.create_responses_for_attempt(
            attempt, questions, option_orders
        )

        await self.student_exam_repository.update_exam_status(
            student_exam.id, attempt.id, student_exam.attempts_count + 1
        )

        return [
            BaseQuestionSchema(
                id=question.id,
                question_text=question.question_text,
                type=question.type,
                has_katex=getattr(question, "has_katex", False),
                weight=getattr(question, "weight", 1),
                options=[
                    BaseQuestionOptionSchema(id=option.id, text=option.text)
                    for option in question.options
                ]
                if question.options
                else None,
            )
            for question in questions
        ]

    async def save_answer(
        self, student_exam_id: str, question: QuestionSetAnswer
    ):
        """Save the answer for a question."""
        # Get and validate student exam
        student_exam = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_links=True
        )
        if not student_exam:
            raise ForbiddenError("Exam not found")

        if student_exam.current_status != StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError("Exam not in progress")

        # Validate exam time
        exam_instance = student_exam.exam_instance_id
        self._validate_exam_time(exam_instance.start_date, exam_instance.end_date)

        # Get the latest attempt
        if not student_exam.latest_attempt_id:
            raise ForbiddenError("No active attempt found")

        attempt = await student_exam.latest_attempt_id.fetch()

        response = await self.student_response_repository.find_by_attempt_and_question(
            attempt.id, question.question_id
        )

        if not response:
            raise ForbiddenError("Question not found in this attempt")

        question_type = response.question_id.type
        update_data = {}
        if question_type == QuestionType.MCQ:
            if question.option_ids is None:
                raise ForbiddenError(
                    "Multiple choice question requires option selections"
                )
            update_data["selected_option_ids"] = question.option_ids

        elif question_type == QuestionType.SINGLECHOICE:
            if question.option_ids is None or len(question.option_ids) != 1:
                raise ForbiddenError(
                    "Single choice question requires exactly one option"
                )
            update_data["selected_option_ids"] = question.option_ids

        elif question_type == QuestionType.SHORTANSWER:
            if question.answer is None:
                raise ForbiddenError("Short answer question requires text input")
            update_data["text_response"] = question.answer

        await self.student_response_repository.update(response.id, update_data)

        await self.student_attempt_repository.update(
            attempt.id, {"last_auto_save": datetime.now(timezone.utc)}
        )
