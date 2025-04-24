import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.models import (
    Collection,
    ExamInstance,
    ExamStatus,
    NotificationSettings,
    SecuritySettings,
)
from app.settings import settings


class TestExamInstanceRouter:
    """Integration tests for teacher endpoints handling exam instances"""

    @pytest.fixture
    async def teacher_user(self, fake):
        """Create a verified teacher for testing"""
        email = fake.email()
        user = User(
            email=email,
            hashed_password=get_password_hash("Password123!"),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
            role=UserRole.TEACHER,
        )
        await user.insert()
        yield user
        await User.find_one(User.email == email).delete()

    @pytest.fixture
    def auth_headers(self, teacher_user):
        """Create auth headers for teacher"""
        token = jwt.encode(
            {"sub": str(teacher_user.id), "role": teacher_user.role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def test_collection(self, teacher_user):
        """Create a test collection"""
        collection = Collection(
            title="Test Collection",
            description="A collection for testing",
            created_by=teacher_user,
            status=ExamStatus.PUBLISHED,
        )
        await collection.insert()
        yield collection
        await Collection.find_one(Collection.id == collection.id).delete()

    @pytest.fixture
    async def test_exam_instance(self, teacher_user, test_collection):
        """Create a test exam instance"""
        now = datetime.now(timezone.utc)
        instance = ExamInstance(
            title="Test Exam",
            start_date=now,
            end_date=now + timedelta(days=7),
            status=ExamStatus.DRAFT,
            max_attempts=1,
            passing_score=50,
            security_settings=SecuritySettings(),
            notification_settings=NotificationSettings(),
            collection_id=test_collection,
            created_by=teacher_user,
            assigned_students=[{"student_id": str(uuid.uuid4())}],
        )
        await instance.insert()
        yield instance
        await ExamInstance.find_one(ExamInstance.id == instance.id).delete()

    async def test_unauthorized_access(self, client):
        """Test unauthorized access to exam instance endpoints"""
        response = await client.get("/v1/exam/teacher/exam-instances/")
        assert response.status_code == 401

    @patch("app.exam.teacher.services.ExamInstanceService.get_by_creator")
    async def test_get_teacher_exam_instances(self, mock_service, client, auth_headers):
        """Test retrieving teacher's exam instances"""
        mock_service.return_value = [
            {
                "id": str(uuid.uuid4()),
                "title": "Test Exam",
                "start_date": datetime.now(timezone.utc),
                "end_date": datetime.now(timezone.utc) + timedelta(days=7),
                "status": "draft",
                "max_attempts": 1,
                "passing_score": 50,
                "security_settings": {},
                "notification_settings": {},
                "collection_id": str(uuid.uuid4()),
                "created_by": str(uuid.uuid4()),
                "assigned_students": [{"student_id": str(uuid.uuid4())}],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        ]

        response = await client.get(
            "/v1/exam/teacher/exam-instances/", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam instances retrieved successfully"

    @patch("app.exam.teacher.services.ExamInstanceService.create_exam_instance")
    async def test_create_exam_instance(
        self, mock_service, client, auth_headers, test_collection
    ):
        """Test creating a new exam instance"""
        mock_service.return_value = str(uuid.uuid4())

        now = datetime.now(timezone.utc)
        instance_data = {
            "title": "New Exam",
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=7)).isoformat(),
            "status": "draft",
            "max_attempts": 1,
            "passing_score": 60,
            "security_settings": {},
            "notification_settings": {},
            "collection_id": str(test_collection.id),
            "assigned_students": [{"student_id": str(uuid.uuid4())}],
        }

        response = await client.post(
            "/v1/exam/teacher/exam-instances/",
            json=instance_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam instance created successfully"

    @patch("app.exam.teacher.services.ExamInstanceService.get_by_id")
    async def test_get_exam_instance_by_id(
        self, mock_service, client, auth_headers, test_exam_instance
    ):
        """Test getting a specific exam instance by ID"""
        from app.exam.teacher.schemas import GetExamInstance

        # Create a properly formatted instance that matches the schema
        instance_data = {
            "id": str(test_exam_instance.id),
            "title": test_exam_instance.title,
            "start_date": test_exam_instance.start_date,
            "end_date": test_exam_instance.end_date,
            "status": test_exam_instance.status,
            "max_attempts": test_exam_instance.max_attempts,
            "passing_score": test_exam_instance.passing_score,
            "security_settings": test_exam_instance.security_settings.model_dump(),
            "notification_settings": test_exam_instance.notification_settings.model_dump(),
            "collection_id": str(test_exam_instance.collection_id.id),
            "created_by": str(test_exam_instance.created_by.id),
            "assigned_students": [
                {"student_id": str(student.student_id)}
                for student in test_exam_instance.assigned_students
            ],
            "created_at": test_exam_instance.created_at,
            "updated_at": test_exam_instance.updated_at,
        }

        # Validate the instance through the model
        mock_service.return_value = GetExamInstance.model_validate(instance_data)

        response = await client.get(
            f"/v1/exam/teacher/exam-instances/{test_exam_instance.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam instance retrieved successfully"

    @patch("app.exam.teacher.services.ExamInstanceService.update_exam_instance")
    async def test_update_exam_instance(
        self, mock_service, client, auth_headers, test_exam_instance
    ):
        """Test updating an exam instance"""
        update_data = {
            "title": "Updated Exam Title",
            "passing_score": 75,
            "status": "published",
        }
        response = await client.put(
            f"/v1/exam/teacher/exam-instances/{test_exam_instance.id}",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam instance updated successfully"

    @patch("app.exam.teacher.services.ExamInstanceService.delete_exam_instance")
    async def test_delete_exam_instance(
        self, mock_service, client, auth_headers, test_exam_instance
    ):
        """Test deleting an exam instance"""
        response = await client.delete(
            f"/v1/exam/teacher/exam-instances/{test_exam_instance.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam instance deleted successfully"
        assert response.json()["data"] == test_exam_instance.id

    @patch("app.exam.teacher.services.ExamInstanceService.get_by_id")
    async def test_get_nonexistent_exam_instance(
        self, mock_service, client, auth_headers
    ):
        """Test getting a non-existent exam instance"""
        from app.core.exceptions import NotFoundError

        mock_service.side_effect = NotFoundError("Exam instance not found")
        instance_id = str(uuid.uuid4())

        response = await client.get(
            f"/v1/exam/teacher/exam-instances/{instance_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404  # Should be 404 Not Found
        assert response.json()["detail"] == "Exam instance not found"
