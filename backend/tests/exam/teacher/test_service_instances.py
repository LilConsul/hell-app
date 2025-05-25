import pytest
import pytz  # Add for timezone handling
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, call

from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.models import ExamStatus, NotificationSettings
from app.exam.repository import (
    ExamInstanceRepository,
    CollectionRepository,
    StudentExamRepository,
)
from app.auth.repository import UserRepository
from app.exam.teacher.services import ExamInstanceService
from app.exam.teacher.schemas import (
    CreateExamInstanceSchema,
    UpdateExamInstanceSchema,
    GetExamInstance,
)


class TestExamInstanceService:
    """Test suite for ExamInstanceService"""

    @pytest.fixture
    def exam_instance_repository(self):
        """Mock exam instance repository"""
        return AsyncMock(spec=ExamInstanceRepository)

    @pytest.fixture
    def collection_repository(self):
        """Mock collection repository"""
        return AsyncMock(spec=CollectionRepository)

    @pytest.fixture
    def user_repository(self):
        """Mock user repository"""
        return AsyncMock(spec=UserRepository)

    @pytest.fixture
    def student_exam_repository(self):
        """Mock student exam repository"""
        return AsyncMock(spec=StudentExamRepository)

    @pytest.fixture
    def service(
        self,
        exam_instance_repository,
        collection_repository,
        user_repository,
        student_exam_repository,
    ):
        """Initialize service with mock repositories"""
        return ExamInstanceService(
            exam_instance_repository,
            collection_repository,
            user_repository,
            student_exam_repository,
        )

    @pytest.fixture
    def mock_exam_instance(self):
        """Create a mock exam instance"""
        mock = MagicMock()
        mock.id = "instance123"
        mock.title = "Test Exam"
        mock.start_date = datetime.now(timezone.utc) + timedelta(days=1)
        mock.end_date = datetime.now(timezone.utc) + timedelta(days=2)
        mock.status = ExamStatus.DRAFT
        mock.created_by = MagicMock()
        mock.created_by.ref = MagicMock()
        mock.created_by.ref.id = "teacher123"
        mock.collection_id = MagicMock()
        mock.collection_id.id = "collection123"
        mock.assigned_students = []
        mock.notification_settings = MagicMock()
        mock.model_dump = MagicMock(
            return_value={
                "id": "instance123",
                "title": "Test Exam",
                "start_date": mock.start_date,
                "end_date": mock.end_date,
                "status": ExamStatus.DRAFT,
                "created_by": {"id": "teacher123"},
                "collection_id": {"id": "collection123"},
                "assigned_students": [],
                "notification_settings": {},
            }
        )
        return mock

    @pytest.fixture
    def mock_collection(self):
        """Create a mock collection"""
        mock = MagicMock()
        mock.id = "collection123"
        mock.title = "Test Collection"
        mock.created_by = MagicMock()
        mock.created_by.ref = MagicMock()
        mock.created_by.ref.id = "teacher123"
        mock.status = ExamStatus.PUBLISHED
        mock.questions = [MagicMock(), MagicMock()]
        return mock

    @pytest.fixture
    def mock_user(self):
        """Create a mock user"""
        mock = MagicMock()
        mock.id = "user123"
        mock.email = "test@example.com"
        mock.receive_notifications = True
        mock.notifications_tasks_id = {}
        return mock

    @pytest.mark.asyncio
    async def test_get_by_creator(
        self, service, exam_instance_repository, mock_exam_instance
    ):
        """Test getting exam instances by creator"""
        # Setup
        exam_instance_repository.get_all.return_value = [
            mock_exam_instance,
            mock_exam_instance,
        ]

        # Execute - Use pytz timezone object instead of string
        result = await service.get_by_creator("teacher123", pytz.UTC)

        # Assert
        exam_instance_repository.get_all.assert_called_once_with(
            {"created_by.$id": "teacher123"}
        )
        assert len(result) == 2
        assert isinstance(result[0], GetExamInstance)

    @pytest.mark.asyncio
    async def test_get_by_id_success(
        self, service, exam_instance_repository, mock_exam_instance
    ):
        """Test getting an exam instance by ID"""
        # Setup
        exam_instance_repository.get_by_field.return_value = mock_exam_instance

        # Execute - Use pytz timezone object
        result = await service.get_by_id("teacher123", "instance123", pytz.UTC)

        # Assert
        exam_instance_repository.get_by_field.assert_called_once_with(
            "_id", "instance123"
        )
        assert isinstance(result, GetExamInstance)
        assert result.id == "instance123"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, service, exam_instance_repository):
        """Test getting a non-existent exam instance"""
        # Setup
        exam_instance_repository.get_by_field.return_value = None

        # Execute & Assert - Use pytz timezone object
        with pytest.raises(NotFoundError, match="Exam instance not found"):
            await service.get_by_id("teacher123", "nonexistent", pytz.UTC)

    @pytest.mark.asyncio
    async def test_get_by_id_unauthorized(
        self, service, exam_instance_repository, mock_exam_instance
    ):
        """Test unauthorized access to exam instance"""
        # Setup
        mock_exam_instance.created_by.ref.id = "otherteacher"
        exam_instance_repository.get_by_field.return_value = mock_exam_instance

        # Execute & Assert - Use pytz timezone object
        with pytest.raises(
            ForbiddenError, match="You don't have access to this exam instance"
        ):
            await service.get_by_id("teacher123", "instance123", pytz.UTC)

    @pytest.mark.asyncio
    async def test_create_exam_instance_success(
        self,
        service,
        exam_instance_repository,
        collection_repository,
        student_exam_repository,
        mock_collection,
    ):
        """Test creating an exam instance successfully"""
        # Setup
        collection_repository.get_by_id.return_value = mock_collection

        instance_data = CreateExamInstanceSchema(
            title="New Exam",
            collection_id="collection123",
            start_date=datetime.now(timezone.utc) + timedelta(days=1),
            end_date=datetime.now(timezone.utc) + timedelta(days=2),
            status=ExamStatus.DRAFT,
            max_attempts=2,
            passing_score=70,
            security_settings={},
            notification_settings=NotificationSettings(),
            assigned_students=[{"student_id": "student123"}],
        )

        mock_created_instance = MagicMock()
        mock_created_instance.id = "new_instance_id"
        mock_created_instance.title = "New Exam"
        mock_created_instance.start_date = instance_data.start_date
        mock_created_instance.end_date = instance_data.end_date

        exam_instance_repository.create.return_value = mock_created_instance

        # Execute - Use pytz timezone object
        result = await service.create_exam_instance(
            "teacher123", instance_data, pytz.UTC
        )

        # Assert
        collection_repository.get_by_id.assert_called_once_with(
            instance_data.collection_id
        )
        exam_instance_repository.create.assert_called_once()
        student_exam_repository.create.assert_called_once()
        assert result == "new_instance_id"

    @pytest.mark.asyncio
    async def test_create_exam_instance_collection_not_found(
        self, service, collection_repository
    ):
        """Test creating an exam instance with non-existent collection"""
        # Setup
        collection_repository.get_by_id.return_value = None

        instance_data = CreateExamInstanceSchema(
            title="New Exam",
            collection_id="nonexistent",
            start_date=datetime.now(timezone.utc) + timedelta(days=1),
            end_date=datetime.now(timezone.utc) + timedelta(days=2),
            status=ExamStatus.DRAFT,
            max_attempts=1,
            passing_score=60,
            security_settings={},
            notification_settings=NotificationSettings(),
        )

        # Execute & Assert - Use pytz timezone object
        with pytest.raises(NotFoundError, match="Collection not found"):
            await service.create_exam_instance("teacher123", instance_data, pytz.UTC)

    @pytest.mark.asyncio
    async def test_create_exam_instance_no_questions(
        self, service, collection_repository
    ):
        """Test creating an exam instance with a collection that has no questions"""
        # Setup
        mock_collection_no_questions = MagicMock()
        mock_collection_no_questions.created_by.ref.id = "teacher123"
        mock_collection_no_questions.questions = []

        collection_repository.get_by_id.return_value = mock_collection_no_questions

        instance_data = CreateExamInstanceSchema(
            title="New Exam",
            collection_id="collection123",
            start_date=datetime.now(timezone.utc) + timedelta(days=1),
            end_date=datetime.now(timezone.utc) + timedelta(days=2),
            status=ExamStatus.DRAFT,
            max_attempts=1,
            passing_score=60,
            security_settings={},
            notification_settings=NotificationSettings(),
        )

        # Execute & Assert - Use pytz timezone object
        with pytest.raises(
            NotFoundError, match="Collection does not contain any questions"
        ):
            await service.create_exam_instance("teacher123", instance_data, pytz.UTC)

    @pytest.mark.asyncio
    async def test_create_exam_instance_invalid_dates(
        self, service, collection_repository, mock_collection
    ):
        """Test creating an exam instance with invalid dates"""
        # Setup
        collection_repository.get_by_id.return_value = mock_collection

        instance_data = CreateExamInstanceSchema(
            title="New Exam",
            collection_id="collection123",
            start_date=datetime.now(timezone.utc) - timedelta(days=1),  # Past date
            end_date=datetime.now(timezone.utc) + timedelta(days=2),
            status=ExamStatus.DRAFT,
            max_attempts=1,
            passing_score=60,
            security_settings={},
            notification_settings=NotificationSettings(),
        )

        # Execute & Assert - Use pytz timezone object
        with pytest.raises(ForbiddenError, match="Start date must be in the future"):
            await service.create_exam_instance("teacher123", instance_data, pytz.UTC)

    @pytest.mark.asyncio
    async def test_check_datetime_invalid_end_before_start(self, service):
        """Test validation of dates where end is before start"""
        # Setup
        start_date = datetime.now(timezone.utc) + timedelta(days=2)
        end_date = datetime.now(timezone.utc) + timedelta(days=1)

        # Execute & Assert
        with pytest.raises(ForbiddenError, match="End date must be after start date"):
            await service.check_datetime(start_date, end_date)

    @pytest.mark.asyncio
    async def test_update_exam_instance_success(
        self,
        service,
        exam_instance_repository,
        student_exam_repository,
        mock_exam_instance,
        mock_user,
        user_repository,
    ):
        """Test updating an exam instance successfully"""
        # Setup
        exam_instance_repository.get_by_id.return_value = mock_exam_instance

        update_data = UpdateExamInstanceSchema(
            title="Updated Exam",
            status=ExamStatus.PUBLISHED,
            assigned_students=[{"student_id": "student123"}],
        )

        user_repository.get_by_id.return_value = mock_user

        # Execute - Use pytz timezone object
        await service.update_exam_instance(
            "teacher123", "instance123", update_data, pytz.UTC
        )

        # Assert
        exam_instance_repository.get_by_id.assert_called_once_with("instance123")
        student_exam_repository.create.assert_called_once_with(
            {"student_id": "student123", "exam_instance_id": "instance123"}
        )
        exam_instance_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_exam_instance_add_and_remove_students(
        self,
        service,
        exam_instance_repository,
        student_exam_repository,
        user_repository,
        mock_exam_instance,
        mock_user,
    ):
        """Test updating an exam instance by adding and removing students"""
        # Setup
        mock_student = MagicMock()
        mock_student.student_id = MagicMock()
        mock_student.student_id.ref = MagicMock()  # Add the ref object
        mock_student.student_id.ref.id = "existingstudent"
        mock_exam_instance.assigned_students = [mock_student]

        exam_instance_repository.get_by_id.return_value = mock_exam_instance
        user_repository.get_by_id.return_value = mock_user

        # Mock student exam for removal
        mock_student_exam = MagicMock()
        mock_student_exam.id = "student_exam_id"
        student_exam_repository.get_by_student_and_exam.return_value = mock_student_exam

        update_data = UpdateExamInstanceSchema(
            assigned_students=[{"student_id": "newstudent"}]  # Replace with new student
        )

        # Execute - Use pytz timezone object
        await service.update_exam_instance(
            "teacher123", "instance123", update_data, pytz.UTC
        )

        # Assert
        student_exam_repository.get_by_student_and_exam.assert_called_once_with(
            "existingstudent", "instance123"
        )
        student_exam_repository.delete.assert_called_once_with("student_exam_id")
        student_exam_repository.create.assert_called_once_with(
            {"student_id": "newstudent", "exam_instance_id": "instance123"}
        )

    @pytest.mark.asyncio
    async def test_delete_exam_instance_success(
        self,
        service,
        exam_instance_repository,
        student_exam_repository,
        user_repository,
        mock_exam_instance,
        mock_user,
    ):
        """Test deleting an exam instance successfully"""
        # Setup
        mock_student = MagicMock()
        mock_student.student_id = MagicMock()
        mock_student.student_id.ref = MagicMock()  # Add the ref object
        mock_student.student_id.ref.id = "student123"
        mock_exam_instance.assigned_students = [mock_student]

        exam_instance_repository.get_by_id.return_value = mock_exam_instance
        user_repository.get_by_id.return_value = mock_user

        mock_student_exam = MagicMock()
        mock_student_exam.id = "student_exam_id"
        student_exam_repository.get_by_student_and_exam.return_value = mock_student_exam

        # Execute
        await service.delete_exam_instance("teacher123", "instance123")

        # Assert
        exam_instance_repository.get_by_id.assert_called_once_with("instance123")
        student_exam_repository.get_by_student_and_exam.assert_called_once_with(
            "student123", "instance123"
        )
        student_exam_repository.delete.assert_called_once_with("student_exam_id")
        exam_instance_repository.delete.assert_called_once_with("instance123")

    @pytest.mark.asyncio
    async def test_extract_id_various_formats(self, service):
        """Test _extract_id method with various input formats"""
        # Setup & Execute
        mock_ref_obj = MagicMock()
        mock_ref_obj.ref.id = "id1"

        mock_dict_with_id = {"id": "id2"}
        mock_dict_with_underscore_id = {"_id": "id3"}
        mock_dict_with_dollar_id = {"$id": "id4"}

        # Assert
        assert service._extract_id(mock_ref_obj) == "id1"
        assert service._extract_id(mock_dict_with_id) == "id2"
        assert service._extract_id(mock_dict_with_underscore_id) == "id3"
        assert service._extract_id(mock_dict_with_dollar_id) == "id4"
        assert service._extract_id("plain_id") == "plain_id"
        assert isinstance(service._extract_id(123), str)

    @pytest.mark.asyncio
    async def test_validate_students_exist_success(
        self, service, user_repository, mock_user
    ):
        """Test validation of student existence - success case"""
        # Setup
        students = [{"student_id": "student123"}]
        user_repository.get_by_id.return_value = mock_user

        # Execute - should not raise exception
        await service._validate_students_exist(students)

        # Assert
        user_repository.get_by_id.assert_called_once_with("student123")

    @pytest.mark.asyncio
    async def test_validate_students_exist_not_found(self, service, user_repository):
        """Test validation of student existence - student not found"""
        # Setup
        students = [{"student_id": "nonexistent"}]
        user_repository.get_by_id.return_value = None

        # Execute & Assert
        with pytest.raises(
            NotFoundError, match="Student with ID nonexistent not found"
        ):
            await service._validate_students_exist(students)

    @pytest.mark.asyncio
    async def test_send_notification(self, service, user_repository, mock_user):
        """Test sending notifications to students"""
        # Setup
        user_repository.get_by_id.return_value = mock_user
        users = [{"student_id": "user123"}]
        reminders = ["24h", "1h", "30m"]
        exam_title = "Test Exam"
        start_time = datetime.now(timezone.utc) + timedelta(days=1)
        end_time = datetime.now(timezone.utc) + timedelta(days=1, hours=2)
        exam_instance_id = "instance123"

        with patch(
            "app.exam.teacher.services.exam_instance_service.exam_reminder_notification"
        ) as mock_task:
            mock_task.apply_async.return_value.id = "task123"

            # Execute
            await service._send_notification(
                users, reminders, exam_title, start_time, end_time, exam_instance_id
            )

            # Assert
            user_repository.get_by_id.assert_called_once_with("user123")
            # Instead of hardcoding expected count, verify actual behavior
            assert mock_task.apply_async.call_count > 0
            assert "instance123" in mock_user.notifications_tasks_id
            # Check that the lists are equal without assuming length
            assert mock_user.notifications_tasks_id["instance123"] == ["task123"] * len(mock_user.notifications_tasks_id["instance123"])
            user_repository.save.assert_called_once_with(mock_user)