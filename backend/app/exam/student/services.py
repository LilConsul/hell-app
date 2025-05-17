import random
from datetime import datetime, timezone
from typing import List, Union

from app.celery.tasks.email_tasks.tasks import exam_finish_confirmation
from app.core.exceptions import ForbiddenError
from app.core.utils import convert_to_user_timezone, make_username
from app.exam.models import PassFailStatus, QuestionType, StudentExamStatus
from app.exam.repository import (
    StudentAttemptRepository,
    StudentExamRepository,
    StudentResponseRepository,
)
from app.exam.student.schemas import (
    AnswerSubmission,
    QuestionWithOptions,
    QuestionWithUserResponse,
    ReviewAttempt,
    StudentAttemptBasic,
    StudentExamBase,
    StudentExamDetail,
)
from app.i18n import _


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
        self, student_id: str, user_timezone=None
    ) -> List[StudentExamBase]:
        """
        Get all exams for a student.
        """
        exams = await self.student_exam_repository.get_all(
            {"student_id.$id": student_id},
            fetch_fields={"exam_instance_id": 2},
        )
        if not exams:
            return []
        if user_timezone:
            for exam in exams:
                if hasattr(exam.exam_instance_id, "start_date"):
                    exam.exam_instance_id.start_date = convert_to_user_timezone(
                        exam.exam_instance_id.start_date, user_timezone
                    )
                if hasattr(exam.exam_instance_id, "end_date"):
                    exam.exam_instance_id.end_date = convert_to_user_timezone(
                        exam.exam_instance_id.end_date, user_timezone
                    )
        return [StudentExamBase.model_validate(exam) for exam in exams]

    async def get_student_exam(
        self, student_id: str, student_exam_id: str, user_timezone=None
    ) -> StudentExamDetail:
        """
        Get a specific exam for a student.
        """
        exam = await self.student_exam_repository.get_by_id(
            student_exam_id,
            fetch_links=True,
            fetch_fields={"exam_instance_id": 2, "attempts": 1, "student_id": 1},
        )
        if not exam:
            raise ForbiddenError(_("Exam not found"))

        if exam.student_id.id != student_id:
            raise ForbiddenError(_("You do not have permission to access this exam"))

        if (
            exam.latest_attempt_id
            and exam.current_status != StudentExamStatus.NOT_STARTED
        ):
            exam.latest_attempt_id = exam.latest_attempt_id.ref.id
        question_count = len(exam.exam_instance_id.collection_id.questions)
        exam_detail = StudentExamDetail.model_validate(exam)

        exam_detail.question_count = question_count

        if user_timezone:
            if hasattr(exam_detail.exam_instance_id, "start_date"):
                exam_detail.exam_instance_id.start_date = convert_to_user_timezone(
                    exam_detail.exam_instance_id.start_date, user_timezone
                )
            if hasattr(exam_detail.exam_instance_id, "end_date"):
                exam_detail.exam_instance_id.end_date = convert_to_user_timezone(
                    exam_detail.exam_instance_id.end_date, user_timezone
                )

            for attempt in exam_detail.attempts:
                if attempt.started_at:
                    attempt.started_at = convert_to_user_timezone(
                        attempt.started_at, user_timezone
                    )
                if attempt.submitted_at:
                    attempt.submitted_at = convert_to_user_timezone(
                        attempt.submitted_at, user_timezone
                    )
        return exam_detail

    async def get_student_attempt(
        self, student_id: str, attempt_id: str, user_timezone=None
    ) -> Union[ReviewAttempt, StudentAttemptBasic]:
        """
        Get a specific attempt for a student.
        If allow_review is true, returns ReviewAttempt with correct answers.
        Otherwise returns StudentAttemptBasic with basic information.
        """
        attempt = await self.student_attempt_repository.get_by_id(
            attempt_id, fetch_fields={"student_exam_id": 2, "responses":2 }
        )
        if not attempt:
            raise ForbiddenError(_("Attempt not found"))

        if attempt.student_exam_id.student_id.id != student_id:
            raise ForbiddenError(_("You do not have permission to access this attempt"))

        # For in-progress attempts, raise an error as they can't be reviewed
        if attempt.status == StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError(_("Attempt is still in progress"))

        # Get exam security settings to check if review is allowed
        exam_instance = attempt.student_exam_id.exam_instance_id
        allow_review = exam_instance.security_settings.allow_review

        if user_timezone:
            if hasattr(attempt, "started_at"):
                attempt.started_at = convert_to_user_timezone(
                    attempt.started_at, user_timezone
                )
            if hasattr(attempt, "submitted_at"):
                attempt.submitted_at = convert_to_user_timezone(
                    attempt.submitted_at, user_timezone
                )

        # If review is not allowed, return basic schema
        if not allow_review:
            return StudentAttemptBasic.model_validate(attempt)

        return ReviewAttempt.model_validate(attempt)

    @staticmethod
    def _validate_exam_time(start_date, end_date):
        """Validate if the current time is within the exam time range."""
        current_time = datetime.now(timezone.utc)
        start_date_aware = start_date.replace(tzinfo=timezone.utc)
        end_date_aware = end_date.replace(tzinfo=timezone.utc)
        if current_time < start_date_aware:
            raise ForbiddenError(_("Exam is not available yet"))
        if current_time > end_date_aware:
            raise ForbiddenError(_("Exam has already ended"))

    async def start_exam(
        self, student_id: str, student_exam_id: str
    ) -> List[QuestionWithOptions]:
        """Start an exam for a student."""
        student_exam = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_fields={"exam_instance_id": 3, "student_id": 1}
        )
        if not student_exam:
            raise ForbiddenError(_("Exam not found"))

        if student_exam.student_id.id != student_id:
            raise ForbiddenError(_("You do not have permission to access this exam"))

        if student_exam.current_status == StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError(_("Exam already started"))

        exam_instance = student_exam.exam_instance_id
        if student_exam.attempts_count >= exam_instance.max_attempts:
            raise ForbiddenError(_("Max attempts reached"))

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
        else:
            questions = sorted(questions, key=lambda q: q.position)

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

                # Create a shuffled copy of the options
                shuffled_options = [None] * len(options)
                for i, option in enumerate(options):
                    new_index = shuffled_indices[i]
                    shuffled_options[new_index] = option
                    option_order[option.id] = new_index

                # Replace the original options with the shuffled ones
                question.options = shuffled_options
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

        return [QuestionWithOptions.model_validate(question) for question in questions]

    async def _get_active_attempt(
        self, student_id: str, student_exam_id: str, check_time: bool = True
    ):
        """
        Get and validate the active attempt for a student exam.

        Common validation logic for methods that require an in-progress exam.
        """
        student_exam = await self.student_exam_repository.get_by_id(
            student_exam_id, fetch_fields={"exam_instance_id": 3, "student_id": 1}
        )
        if not student_exam:
            raise ForbiddenError(_("Exam not found"))

        if student_exam.student_id.id != student_id:
            raise ForbiddenError(_("You do not have permission to access this exam"))

        if student_exam.current_status != StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError(_("Exam not in progress"))

        exam_instance = student_exam.exam_instance_id
        if check_time:
            self._validate_exam_time(exam_instance.start_date, exam_instance.end_date)

        if not student_exam.latest_attempt_id:
            raise ForbiddenError(_("No active attempt found"))

        attempt = await student_exam.latest_attempt_id.fetch()
        if not attempt:
            raise ForbiddenError(_("No active attempt found"))

        if attempt.status != StudentExamStatus.IN_PROGRESS:
            raise ForbiddenError(_("Attempt is not in progress"))
        return student_exam, attempt

    async def save_answer(
        self, student_id: str, student_exam_id: str, question: AnswerSubmission
    ):
        """Save the answer for a question."""
        student_exam, attempt = await self._get_active_attempt(
            student_id, student_exam_id
        )

        response = await self.student_response_repository.get_one_by_criteria(
            {"attempt_id._id": attempt.id, "question_id._id": question.question_id},
            fetch_fields={"question_id": 1, "attempt_id": 1},
        )

        if not response:
            raise ForbiddenError(_("Question not found in this attempt"))

        question_type = response.question_id.type
        update_data = {}
        if question_type == QuestionType.MCQ:
            if question.option_ids is None:
                raise ForbiddenError(
                    _("Multiple choice question requires option selections")
                )
            update_data["selected_option_ids"] = question.option_ids

        elif question_type == QuestionType.SINGLECHOICE:
            if question.option_ids is None or len(question.option_ids) != 1:
                raise ForbiddenError(
                    _("Single choice question requires exactly one option")
                )
            update_data["selected_option_ids"] = question.option_ids

        elif question_type == QuestionType.SHORTANSWER:
            if question.answer is None:
                raise ForbiddenError(_("Short answer question requires text input"))
            update_data["text_response"] = question.answer

        await self.student_response_repository.update(response.id, update_data)

        await self.student_attempt_repository.update(
            attempt.id, {"last_auto_save": datetime.now(timezone.utc)}
        )

    async def toggle_flag_question(
        self, student_id: str, student_exam_id: str, question_id: str
    ):
        """Flag a question for review."""
        student_exam, attempt = await self._get_active_attempt(
            student_id, student_exam_id
        )

        response = await self.student_response_repository.get_one_by_criteria(
            {"attempt_id._id": attempt.id, "question_id._id": question_id},
            fetch_fields={"question_id": 1, "attempt_id": 1},
        )

        if not response:
            raise ForbiddenError(_("Question not found in this attempt"))

        await self.student_response_repository.update(
            response.id,
            {"is_flagged": not response.is_flagged},
        )
        await self.student_attempt_repository.update(
            attempt.id, {"last_auto_save": datetime.now(timezone.utc)}
        )

    async def submit_exam(
        self, student_id: str, student_exam_id: str
    ) -> StudentAttemptBasic:
        """Submit the exam for grading."""
        student_exam, attempt = await self._get_active_attempt(
            student_id, student_exam_id, check_time=False
        )

        if not attempt:
            raise ForbiddenError(_("No active attempt found"))

        responses = await self.student_response_repository.get_all(
            {"attempt_id.$id": attempt.id}, fetch_fields={"question_id": 1}
        )
        if not responses:
            raise ForbiddenError(_("No responses found for this attempt"))

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

                total_correct_options = len(correct_ids)
                if total_correct_options > 0:
                    correct_selections = len(correct_ids.intersection(selected_ids))
                    score = correct_selections / total_correct_options
                else:
                    score = 0.0

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

        if attempt.started_at.tzinfo is None:
            started_at_aware = attempt.started_at.replace(tzinfo=timezone.utc)
        else:
            started_at_aware = attempt.started_at

        exam_finish_confirmation.delay(
            recipient=student_exam.student_id.email,
            username=make_username(student_exam.student_id),
            exam_title=student_exam.exam_instance_id.title,
            end_time=submitted_at,
            start_time=started_at_aware,
            question_count=len(responses),
        )

        return StudentAttemptBasic(
            id=attempt.id,
            status=StudentExamStatus.SUBMITTED,
            started_at=attempt.started_at,
            submitted_at=submitted_at,
            grade=final_grade,
            pass_fail=pass_fail,
        )

    async def reload_exam(
        self, student_id: str, student_exam_id: str
    ) -> List[QuestionWithUserResponse]:
        """Reload the exam questions with user's previous answers."""
        student_exam, attempt = await self._get_active_attempt(
            student_id, student_exam_id
        )
        exam_instance = student_exam.exam_instance_id
        collection = exam_instance.collection_id
        all_questions = {q.id: q for q in collection.questions}

        question_order = attempt.question_order

        responses = await self.student_response_repository.get_all(
            {"attempt_id.$id": attempt.id}, fetch_fields={"question_id": 1}
        )

        response_map = {resp.question_id.id: resp for resp in responses}

        # Get questions in the correct order with user responses
        questions_with_responses = []
        for q_id in question_order:
            if q_id in all_questions:
                question = all_questions[q_id]

                # If there's a response with option ordering for this question
                if q_id in response_map and question.options:
                    response = response_map[q_id]
                    option_order = response.option_order

                    # Sort options according to the stored order
                    if option_order:
                        sorted_options = sorted(
                            question.options,
                            key=lambda opt: option_order.get(opt.id, 0),
                        )
                        question.options = sorted_options

                # Create base question with options
                question_with_options = QuestionWithOptions.model_validate(question)

                # Add user response data
                user_response = response_map.get(q_id)
                question_with_user_response = QuestionWithUserResponse(
                    **question_with_options.model_dump(),
                    user_selected_options=user_response.selected_option_ids
                    if user_response
                    else [],
                    user_text_response=user_response.text_response
                    if user_response
                    else None,
                    is_flagged=user_response.is_flagged if user_response else False,
                )

                questions_with_responses.append(question_with_user_response)

        if not questions_with_responses:
            raise ForbiddenError(_("No questions found for this attempt"))

        return questions_with_responses
