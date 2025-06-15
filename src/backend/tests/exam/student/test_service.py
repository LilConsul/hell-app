import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.exceptions import ForbiddenError
from app.exam.models import PassFailStatus, QuestionType, StudentExamStatus, ExamStatus
from app.exam.student.schemas import (
    AnswerSubmission,
    QuestionWithOptions,
    QuestionWithUserResponse,
    ReviewAttempt,
    StudentAttemptBasic,
    StudentExamBase,
    StudentExamDetail,
)
from app.exam.student.services import StudentExamService
from app.exam.repository import (
    StudentExamRepository,
    StudentAttemptRepository,
    StudentResponseRepository,
)


class TestStudentExamService:
    """Test suite for StudentExamService"""

    @pytest.fixture
    def service(self):
        """Create StudentExamService with mocked repositories"""
        return StudentExamService(
            student_exam_repository=AsyncMock(spec=StudentExamRepository),
            student_attempt_repository=AsyncMock(spec=StudentAttemptRepository),
            student_response_repository=AsyncMock(spec=StudentResponseRepository),
        )

    @pytest.fixture
    def mock_exam_instance(self):
        """Create a mock exam instance with required fields"""
        mock = MagicMock()
        mock.id = "exam123"
        mock.title = "Test Exam"
        mock.start_date = datetime.now(timezone.utc)
        mock.end_date = datetime.now(timezone.utc) + timedelta(hours=1)
        mock.status = ExamStatus.PUBLISHED
        mock.max_attempts = 1
        mock.passing_score = 70

        # Setup nested objects
        mock.security_settings = MagicMock()
        mock.security_settings.allow_review = True
        mock.security_settings.shuffle_questions = False

        mock.notification_settings = MagicMock()
        mock.notification_settings.reminder_enabled = True
        mock.notification_settings.reminders = ["24h", "1h"]

        mock.created_by = MagicMock()
        mock.created_by.id = "teacher123"
        mock.created_by.email = "teacher@example.com"
        mock.created_by.first_name = "Test"
        mock.created_by.last_name = "Teacher"
        mock.created_by.role = "teacher"

        return mock

    @pytest.fixture
    def mock_student_exam(self, mock_exam_instance):
        """Create a mock student exam with required fields"""
        mock = MagicMock()
        mock.id = "studentexam123"
        mock.exam_instance_id = mock_exam_instance
        mock.current_status = StudentExamStatus.NOT_STARTED
        mock.attempts_count = 0

        # Setup student ID
        mock.student_id = MagicMock()
        mock.student_id.id = "student123"
        mock.student_id.email = "student@example.com"

        # Setup attempts
        mock.attempts = []
        mock.latest_attempt_id = None

        return mock

    @pytest.mark.asyncio
    async def test_get_student_exams_success(self, service):
        """Test successful retrieval of student exams"""
        # Setup
        with patch(
            "app.exam.student.schemas.StudentExamBase.model_validate"
        ) as mock_validate:
            mock_validate.return_value = MagicMock(spec=StudentExamBase)
            service.student_exam_repository.get_all.return_value = [MagicMock()]

            # Execute
            result = await service.get_student_exams("student123")

            # Assert
            service.student_exam_repository.get_all.assert_called_once()
            mock_validate.assert_called_once()
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_student_exams_empty(self, service):
        """Test empty list returned when student has no exams"""
        # Setup
        service.student_exam_repository.get_all.return_value = []

        # Execute
        result = await service.get_student_exams("student123")

        # Assert
        assert result == []
        service.student_exam_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_student_exam_success(self, service, mock_student_exam):
        """Test successful retrieval of a specific student exam"""
        # Setup
        with patch(
            "app.exam.student.schemas.StudentExamDetail.model_validate"
        ) as mock_validate:
            mock_validate.return_value = MagicMock(spec=StudentExamDetail)
            service.student_exam_repository.get_by_id.return_value = mock_student_exam

            # Execute
            result = await service.get_student_exam("student123", "exam123")

            # Assert
            service.student_exam_repository.get_by_id.assert_called_once()
            mock_validate.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_student_exam_not_found(self, service):
        """Test exam not found scenario"""
        # Setup
        service.student_exam_repository.get_by_id.return_value = None

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="Exam not found"):
            await service.get_student_exam("student123", "nonexistent")

    @pytest.mark.asyncio
    async def test_get_student_exam_unauthorized(self, service, mock_student_exam):
        """Test unauthorized access to student exam"""
        # Setup
        mock_student_exam.student_id.id = "other_student"
        service.student_exam_repository.get_by_id.return_value = mock_student_exam

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="You do not have permission"):
            await service.get_student_exam("student123", "exam123")

    @pytest.mark.asyncio
    async def test_get_student_attempt_success(self, service):
        """Test successful retrieval of a student attempt with review allowed"""
        # Setup
        mock_attempt = MagicMock()
        mock_attempt.id = "attempt123"
        mock_attempt.status = StudentExamStatus.SUBMITTED
        mock_attempt.student_exam_id.student_id.id = "student123"
        mock_attempt.student_exam_id.exam_instance_id.security_settings.allow_review = (
            True
        )
        mock_attempt.pass_fail = PassFailStatus.PASS

        service.student_attempt_repository.get_by_id.return_value = mock_attempt

        with patch(
            "app.exam.student.schemas.ReviewAttempt.model_validate"
        ) as mock_validate:
            mock_validate.return_value = MagicMock(spec=ReviewAttempt)

            # Execute
            result = await service.get_student_attempt("student123", "attempt123")

            # Assert
            service.student_attempt_repository.get_by_id.assert_called_once()
            mock_validate.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_student_attempt_no_review(self, service):
        """Test attempt retrieval when review is not allowed"""
        # Setup
        mock_attempt = MagicMock()
        mock_attempt.id = "attempt123"
        mock_attempt.status = StudentExamStatus.SUBMITTED
        mock_attempt.student_exam_id.student_id.id = "student123"
        mock_attempt.student_exam_id.exam_instance_id.security_settings.allow_review = (
            False
        )
        mock_attempt.pass_fail = PassFailStatus.PASS

        service.student_attempt_repository.get_by_id.return_value = mock_attempt

        with patch(
            "app.exam.student.schemas.StudentAttemptBasic.model_validate"
        ) as mock_validate:
            mock_validate.return_value = MagicMock(spec=StudentAttemptBasic)

            # Execute
            result = await service.get_student_attempt("student123", "attempt123")

            # Assert
            service.student_attempt_repository.get_by_id.assert_called_once()
            mock_validate.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_student_attempt_in_progress(self, service):
        """Test attempt retrieval when attempt is still in progress"""
        # Setup
        mock_attempt = MagicMock()
        mock_attempt.status = StudentExamStatus.IN_PROGRESS
        mock_attempt.student_exam_id.student_id.id = "student123"

        service.student_attempt_repository.get_by_id.return_value = mock_attempt

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="Attempt is still in progress"):
            await service.get_student_attempt("student123", "attempt123")

    @pytest.mark.asyncio
    async def test_start_exam_success(self, service, mock_student_exam):
        """Test successful exam start"""
        # Setup
        mock_student_exam.current_status = StudentExamStatus.NOT_STARTED
        service.student_exam_repository.get_by_id.return_value = mock_student_exam

        # Mock collection and questions
        mock_q1 = MagicMock(id="q1", options=[MagicMock(id="o1")], position=1)
        mock_q2 = MagicMock(id="q2", options=[MagicMock(id="o2")], position=2)
        mock_student_exam.exam_instance_id.collection_id.questions = [
            mock_q1,
            mock_q2,
        ]

        mock_attempt = MagicMock()
        service.student_attempt_repository.create_exam_attempt.return_value = (
            mock_attempt
        )

        with patch(
            "app.exam.student.schemas.QuestionWithOptions.model_validate"
        ) as mock_validate:
            mock_validate.return_value = MagicMock(spec=QuestionWithOptions)

            # Execute
            result = await service.start_exam("student123", "exam123")

            # Assert
            service.student_exam_repository.get_by_id.assert_called_once()
            service.student_attempt_repository.create_exam_attempt.assert_called_once()
            assert service.student_exam_repository.update.called

    @pytest.mark.asyncio
    async def test_start_exam_already_started(self, service, mock_student_exam):
        """Test exam start when already in progress"""
        # Setup
        mock_student_exam.current_status = StudentExamStatus.IN_PROGRESS
        service.student_exam_repository.get_by_id.return_value = mock_student_exam

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="Exam already started"):
            await service.start_exam("student123", "exam123")

    @pytest.mark.asyncio
    async def test_save_answer_mcq_success(self, service):
        """Test saving an MCQ answer successfully"""
        # Setup
        mock_student_exam = MagicMock()
        mock_attempt = MagicMock(id="attempt123", status=StudentExamStatus.IN_PROGRESS)
        mock_response = MagicMock()
        mock_response.question_id.type = QuestionType.MCQ

        # Use patch to avoid "await" issues
        with patch.object(
            service,
            "_get_active_attempt",
            return_value=(mock_student_exam, mock_attempt),
        ):
            service.student_response_repository.get_one_by_criteria.return_value = (
                mock_response
            )

            # Execute
            question = AnswerSubmission(question_id="q1", option_ids=["opt1", "opt2"])
            await service.save_answer("student123", "exam123", question)

            # Assert
            service.student_response_repository.update.assert_called_once()
            service.student_attempt_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_exam_success(self, service):
        """Test successful exam submission"""
        # Setup
        mock_student_exam = MagicMock()
        mock_student_exam.exam_instance_id.passing_score = 70
        mock_student_exam.student_id.email = "student@example.com"
        mock_student_exam.student_id.first_name = "Test"
        mock_student_exam.student_id.last_name = "Student"
        mock_student_exam.exam_instance_id.title = "Test Exam Title"  # Add this line

        mock_attempt = MagicMock(id="attempt123", status=StudentExamStatus.IN_PROGRESS)
        mock_attempt.started_at = datetime.now(timezone.utc) - timedelta(hours=1)

        # Setup responses
        mock_responses = [
            MagicMock(
                question_id=MagicMock(
                    type=QuestionType.MCQ,
                    weight=1,
                    options=[MagicMock(id="o1", is_correct=True)],
                ),
                selected_option_ids=["o1"],
            )
        ]

        # Use patch to avoid "await" issues
        with (
            patch.object(
                service,
                "_get_active_attempt",
                return_value=(mock_student_exam, mock_attempt),
            ),
            patch("app.celery.tasks.email_tasks.tasks.exam_finish_confirmation"),
        ):
            service.student_response_repository.get_all.return_value = mock_responses

            # Execute
            result = await service.submit_exam("student123", "exam123")

            # Assert
            assert service.student_response_repository.update.called
            assert service.student_attempt_repository.update.called
            assert service.student_exam_repository.update.called
            assert isinstance(result, StudentAttemptBasic)

    @pytest.mark.asyncio
    async def test_reload_exam_success(self, service):
        """Test successfully reloading an exam in progress"""
        # Setup
        mock_student_exam = MagicMock()
        mock_attempt = MagicMock(id="attempt123", status=StudentExamStatus.IN_PROGRESS)
        mock_attempt.question_order = ["q1", "q2"]

        # Setup questions and responses
        mock_question1_data = {
            "id": "q1",
            "question_text": "Question 1",
            "type": QuestionType.MCQ,
            "has_katex": False,
            "weight": 1,
            "options": [MagicMock(id="o1", text="Option 1")],
        }
        mock_question2_data = {
            "id": "q2",
            "question_text": "Question 2",
            "type": QuestionType.SHORTANSWER,
            "has_katex": False,
            "weight": 1,
            "options": [],
        }

        mock_question1 = MagicMock(**mock_question1_data)
        mock_question1.options = [MagicMock(id="o1", text="Option 1")]

        mock_question2 = MagicMock(**mock_question2_data)
        mock_question2.options = []

        mock_student_exam.exam_instance_id.collection_id.questions = [
            mock_question1,
            mock_question2,
        ]

        mock_response1 = MagicMock(
            question_id=MagicMock(id="q1"),
            selected_option_ids=["o1"],
            option_order={"o1": 0},
            text_response=None,
            is_flagged=False,
        )
        mock_response2 = MagicMock(
            question_id=MagicMock(id="q2"),
            selected_option_ids=[],
            option_order={},
            text_response="Answer for Q2",
            is_flagged=True,
        )

        # Use patch to avoid "await" issues
        with (
            patch.object(
                service,
                "_get_active_attempt",
                return_value=(mock_student_exam, mock_attempt),
            ),
            patch("app.exam.student.schemas.QuestionWithOptions.model_validate")
            as mock_qwo_validate,
            patch(
                "app.exam.student.schemas.QuestionWithUserResponse"
            ) as mock_question_response_schema,
        ):
            def side_effect_qwo_validate(question_mock):
                if question_mock.id == "q1":
                    validated_qwo = QuestionWithOptions(**mock_question1_data)
                elif question_mock.id == "q2":
                    q2_data_for_schema = mock_question2_data.copy()
                    if q2_data_for_schema["options"] is None:
                        q2_data_for_schema["options"] = []
                    validated_qwo = QuestionWithOptions(**q2_data_for_schema)
                else:
                    validated_qwo = MagicMock()
                return validated_qwo

            mock_qwo_validate.side_effect = side_effect_qwo_validate

            mock_question_response_schema.return_value = MagicMock(
                spec=QuestionWithUserResponse
            )
            service.student_response_repository.get_all.return_value = [
                mock_response1,
                mock_response2,
            ]

            # Execute
            result = await service.reload_exam("student123", "exam123")

            # Assert
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_toggle_flag_question_success(self, service):
        """Test toggling flag on a question"""
        # Setup
        mock_student_exam = MagicMock()
        mock_attempt = MagicMock(id="attempt123", status=StudentExamStatus.IN_PROGRESS)
        mock_response = MagicMock(is_flagged=False)

        # Use patch to avoid "await" issues
        with patch.object(
            service,
            "_get_active_attempt",
            return_value=(mock_student_exam, mock_attempt),
        ):
            service.student_response_repository.get_one_by_criteria.return_value = (
                mock_response
            )

            # Execute
            await service.toggle_flag_question("student123", "exam123", "question123")

            # Assert
            service.student_response_repository.update.assert_called_once_with(
                mock_response.id,
                {"is_flagged": True},
            )
            service.student_attempt_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_validate_exam_time_past_end_date(self, service):
        """Test validation for exam outside valid time window (ended)"""
        # Setup past end date
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(hours=2)
        end_date = now - timedelta(hours=1)

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="Exam has already ended"):
            StudentExamService._validate_exam_time(start_date, end_date)

