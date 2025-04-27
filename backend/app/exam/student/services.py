import random
from datetime import datetime, timezone
from typing import List, Union

from app.core.exceptions import ForbiddenError
from app.exam.models import PassFailStatus, QuestionType, StudentExamStatus
from app.exam.repository import (
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)
from app.exam.student.schemas import (
    BaseGetStudentExamSchema,
    BaseQuestionOptionSchema,
    BaseQuestionSchema,
    DetailGetStudentExamSchema,
    QuestionSetAnswer,
    ReviewAttemptSchema,
    ReviewResponseSchema,
    StudentAttemptBasicSchema,
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
        return [BaseGetStudentExamSchema.model_validate(exam) for exam in data]

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
        data.latest_attempt_id = data.latest_attempt_id.ref.id
        return DetailGetStudentExamSchema.model_validate(data)

    async def get_student_attempt(
        self, student_id: str, attempt_id: str
    ) -> Union[ReviewAttemptSchema, StudentAttemptBasicSchema]:
        """
        Get a specific attempt for a student.
        If allow_review is true, returns ReviewAttemptSchema with correct answers.
        Otherwise returns StudentAttemptBasicSchema with basic information.
        """
        data = await self.student_attempt_repository.get_by_id(
            attempt_id, fetch_links=True
        )
        if not data:
            raise ForbiddenError("Attempt not found")

        if data.student_exam_id.student_id.id != student_id:
            raise ForbiddenError("You do not have permission to access this attempt")

        # For in-progress attempts, raise an error as they can't be reviewed
        if data.status == StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError("Attempt is still in progress")

        # Get exam security settings to check if review is allowed
        exam_instance = data.student_exam_id.exam_instance_id
        allow_review = exam_instance.security_settings.allow_review

        # If review is not allowed, return basic schema
        if not allow_review:
            return StudentAttemptBasicSchema(
                id=data.id,
                status=data.status,
                started_at=data.started_at,
                submitted_at=data.submitted_at,
                grade=data.grade,
                pass_fail=data.pass_fail,
            )

        # If review is allowed, prepare detailed response with correct answers
        attempt_dict = data.model_dump()

        if hasattr(data, "responses") and data.responses:
            # Create detailed review responses with correct answers
            review_responses = []
            for response in data.responses:
                question = response.question_id
                review_response = response.model_dump()

                # Determine if the answer is correct and add correct answer info
                is_correct = False
                correct_option_ids = []
                correct_text_answer = None

                if question.type in [QuestionType.MCQ, QuestionType.SINGLECHOICE]:
                    correct_option_ids = [
                        opt.id for opt in question.options if opt.is_correct
                    ]

                    if question.type == QuestionType.MCQ:
                        is_correct = set(response.selected_option_ids) == set(
                            correct_option_ids
                        )
                    else:  # SINGLECHOICE
                        is_correct = (
                            len(response.selected_option_ids) == 1
                            and response.selected_option_ids[0] in correct_option_ids
                        )

                elif question.type == QuestionType.SHORTANSWER:
                    correct_text_answer = question.correct_input_answer
                    is_correct = (
                        response.text_response
                        and correct_text_answer
                        and response.text_response.strip().lower()
                        == correct_text_answer.strip().lower()
                    )

                review_response.update(
                    {
                        "is_correct": is_correct,
                        "correct_option_ids": correct_option_ids,
                        "correct_text_answer": correct_text_answer,
                    }
                )

                review_responses.append(
                    ReviewResponseSchema.model_validate(review_response)
                )

            attempt_dict["responses"] = review_responses
            attempt_dict["allow_review"] = True
            return ReviewAttemptSchema.model_validate(attempt_dict)

        # If no responses but review is allowed, return basic review attempt schema
        attempt_dict["allow_review"] = True
        return ReviewAttemptSchema.model_validate(attempt_dict)

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

        await self.student_exam_repository.update(
            student_exam.id,
            {
                "current_status": StudentExamStatus.IN_PROGRESS,
                "latest_attempt_id": attempt.id,
                "attempts_count": student_exam.attempts_count + 1,
            },
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

    async def _get_active_attempt(self, student_exam_id: str):
        """
        Get and validate the active attempt for a student exam.

        Common validation logic for methods that require an in-progress exam.
        """
        student_exam = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_links=True
        )
        if not student_exam:
            raise ForbiddenError("Exam not found")

        if student_exam.current_status != StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError("Exam not in progress")

        exam_instance = student_exam.exam_instance_id
        self._validate_exam_time(exam_instance.start_date, exam_instance.end_date)

        if not student_exam.latest_attempt_id:
            raise ForbiddenError("No active attempt found")

        attempt = await student_exam.latest_attempt_id.fetch()
        if not attempt:
            raise ForbiddenError("No active attempt found")

        if attempt.status != StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError("Attempt is not in progress")
        return student_exam, attempt

    async def save_answer(self, student_exam_id: str, question: QuestionSetAnswer):
        """Save the answer for a question."""
        student_exam, attempt = await self._get_active_attempt(student_exam_id)

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

    async def toggle_flag_question(self, student_exam_id: str, question_id: str):
        """Flag a question for review."""
        student_exam, attempt = await self._get_active_attempt(student_exam_id)

        response = await self.student_response_repository.find_by_attempt_and_question(
            attempt.id, question_id
        )

        if not response:
            raise ForbiddenError("Question not found in this attempt")

        await self.student_response_repository.update(
            response.id,
            {"is_flagged": not response.is_flagged},
        )
        await self.student_attempt_repository.update(
            attempt.id, {"last_auto_save": datetime.now(timezone.utc)}
        )

    async def submit_exam(self, student_exam_id: str) -> StudentAttemptBasicSchema:
        """Submit the exam for grading."""
        student_exam, attempt = await self._get_active_attempt(student_exam_id)

        if not attempt:
            raise ForbiddenError("No active attempt found")

        responses = await self.student_response_repository.find_by_attempt_id(
            attempt.id
        )
        if not responses:
            raise ForbiddenError("No responses found for this attempt")

        total_weight = 0
        weighted_score = 0
        for response in responses:
            question = response.question_id
            question_weight = question.weight if question.weight else 1
            total_weight += question_weight
            score = 0

            if question.type == QuestionType.MCQ:
                correct_ids = set(
                    [option.id for option in question.options if option.is_correct]
                )
                selected_ids = set(response.selected_option_ids)

                if selected_ids == correct_ids and selected_ids:
                    score = 1.0
            elif question.type == QuestionType.SINGLECHOICE:
                correct_option_ids = [
                    opt.id for opt in question.options if opt.is_correct
                ]
                if (
                    len(response.selected_option_ids) == 1
                    and response.selected_option_ids[0] in correct_option_ids
                ):
                    score = 1.0

            elif question.type == QuestionType.SHORTANSWER:
                if response.text_response and question.correct_input_answer:
                    if (
                        response.text_response.strip().lower()
                        == question.correct_input_answer.strip().lower()
                    ):
                        score = 1.0

            await self.student_response_repository.update(response.id, {"score": score})

            weighted_score += score * question_weight

        # Calculate final grade as percentage
        final_grade = weighted_score / total_weight * 100 if total_weight > 0 else 0
        pass_fail = (
            PassFailStatus.PASS
            if final_grade >= student_exam.exam_instance_id.passing_score
            else PassFailStatus.FAIL
        )

        submitted_at = datetime.now(timezone.utc)
        await self.student_attempt_repository.update(
            attempt.id,
            {
                "status": StudentExamStatus.SUBMITTED,
                "submitted_at": submitted_at,
                "grade": final_grade,
                "pass_fail": pass_fail,
            },
        )

        await self.student_exam_repository.update(
            student_exam.id, {"current_status": StudentExamStatus.SUBMITTED}
        )

        return StudentAttemptBasicSchema(
            id=attempt.id,
            status=StudentExamStatus.SUBMITTED,
            started_at=attempt.started_at,
            submitted_at=submitted_at,
            grade=final_grade,
            pass_fail=pass_fail,
        )
