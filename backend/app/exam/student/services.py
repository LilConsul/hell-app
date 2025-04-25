import random
from datetime import datetime, timezone
from typing import List

from app.core.exceptions import ForbiddenError
from app.exam.models import StudentAttempt, StudentExamStatus, StudentResponse
from app.exam.repository import (
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)
from app.exam.student.schemas import (
    BaseGetStudentExamSchema,
    DetailGetStudentExamSchema,
    QuestionForStudent,
    QuestionOptionForStudent,
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
        self, student_id: str, exam_id: str
    ) -> DetailGetStudentExamSchema:
        """
        Get a specific exam for a student.
        """
        data = await self.student_exam_repository.get_by_student_and_exam(
            student_id, exam_id, fetch_links=True
        )
        return DetailGetStudentExamSchema.model_validate(
            {
                **data.model_dump(),
                "exam_instance_id": data.exam_instance_id.model_dump(),
            }
        )

    async def start_exam(self, student_id: str, exam_id: str):
        """
        Start an exam for a student.
        """
        student_exam = await self.student_exam_repository.get_by_student_and_exam(
            student_id, exam_id, fetch_links=True
        )
        if not student_exam:
            raise ForbiddenError("Exam not found")

        if student_exam.current_status == StudentExamStatus.IN_PROGRESS:
            # TODO: add reload student progress of started exam
            raise ForbiddenError("Exam already started")

        exam_instance = student_exam.exam_instance_id
        if student_exam.attempts_count >= exam_instance.max_attempts:
            raise ForbiddenError("Max attempts reached")

        collection = student_exam.exam_instance_id.collection_id

        questions = collection.questions
        question_ids = [question.id for question in questions]

        if exam_instance.security_settings.shuffle_questions:
            # Shuffle both lists together
            combined = list(zip(question_ids, questions))
            random.shuffle(combined)
            question_ids, questions = zip(*combined) if combined else ([], [])
            question_ids = list(question_ids)
            questions = list(questions)

        new_attempt = StudentAttempt(
            student_exam_id=student_exam,
            status=StudentExamStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
            question_order=question_ids,
        )

        attempt = await self.student_attempt_repository.create(new_attempt.model_dump())

        for question in questions:
            options = question.options
            option_order = {}

            # Create option_order mapping
            if exam_instance.security_settings.shuffle_questions:
                shuffled_indices = list(range(len(options)))
                random.shuffle(shuffled_indices)
                for i, option in enumerate(options):
                    option_order[option.id] = shuffled_indices[i]
            else:
                # Sequential order if no shuffling
                for i, option in enumerate(options):
                    option_order[option.id] = i

            response = StudentResponse(
                attempt_id=attempt,
                question_id=question,
                option_order=option_order,
                selected_option_ids=[],
            )
            await self.student_response_repository.create(response.model_dump())

        update_data = {
            "current_status": StudentExamStatus.IN_PROGRESS,
            "latest_attempt_id": attempt.id,
            "attempts_count": student_exam.attempts_count + 1,
        }

        await self.student_exam_repository.update(student_exam.id, update_data)

        sanitized_questions = []
        for question in questions:
            sanitized_question = QuestionForStudent(
                id=question.id,
                question_text=question.question_text,
                type=question.type,
                has_katex=question.has_katex,
                weight=question.weight,
            )

            # Only include options if they exist
            if question.options:
                sanitized_question.options = [
                    QuestionOptionForStudent(id=option.id, text=option.text)
                    for option in question.options
                ]

            sanitized_questions.append(sanitized_question)

        return sanitized_questions
