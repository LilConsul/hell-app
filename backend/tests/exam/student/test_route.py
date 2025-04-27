import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import jwt
import pytest
from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.models import (
    ExamStatus,
    PassFailStatus,
    StudentAttempt,
    StudentExam,
    StudentExamStatus,
)
from app.exam.student.schemas import (
    BaseGetStudentExamSchema,
    BaseQuestionSchema,
    CurrentAttemptSchema,
    DetailGetStudentExamSchema,
    StudentAttemptBasicSchema,
)
from app.settings import settings


class TestStudentRouter:
    """Integration tests for student exam endpoints"""

    @pytest.fixture
    async def student_user(self, fake):
        """Create a verified student for testing"""
        email = fake.email()
        user = User(
            email=email,
            hashed_password=get_password_hash("Password123!"),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            is_verified=True,
            role=UserRole.STUDENT,
        )
        await user.insert()
        yield user
        await User.find_one(User.email == email).delete()

    @pytest.fixture
    def auth_headers(self, student_user):
        """Create auth headers for student"""
        token = jwt.encode(
            {"sub": str(student_user.id), "role": student_user.role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def test_student_exam(self, student_user):
        """Create a test student exam"""
        exam_id = str(uuid.uuid4())
        student_exam = StudentExam(
            id=str(uuid.uuid4()),
            exam_instance_id=exam_id,
            student_id=student_user,
            current_status=StudentExamStatus.NOT_STARTED,
            attempts_count=0,
        )
        await student_exam.insert()
        yield student_exam
        await StudentExam.find_one(StudentExam.id == student_exam.id).delete()

    @pytest.fixture
    async def test_student_attempt(self, test_student_exam):
        """Create a test student attempt"""
        attempt = StudentAttempt(
            id=str(uuid.uuid4()),
            student_exam_id=test_student_exam,
            status=StudentExamStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
            question_order=["q1", "q2", "q3"],
        )
        await attempt.insert()
        yield attempt
        await StudentAttempt.find_one(StudentAttempt.id == attempt.id).delete()

    async def test_unauthorized_access(self, client):
        """Test unauthorized access to student endpoints"""
        response = await client.get("/v1/exam/student/exams")
        assert response.status_code == 401

    @patch("app.exam.student.services.StudentExamService.get_student_exams")
    async def test_get_student_exams(
        self, mock_service, client, auth_headers, student_user
    ):
        """Test retrieving student's exams"""
        # Mock return value with properly structured data
        exam_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        # Create a valid schema instance with all required fields
        mock_data = {
            "id": str(uuid.uuid4()),
            "exam_instance_id": {
                "id": exam_id,
                "title": "Test Exam",
                "created_by": {
                    "id": user_id,
                    "email": "teacher@example.com",
                    "first_name": "Test",
                    "last_name": "Teacher",
                    "role": UserRole.TEACHER,  # Add required field
                    "receive_notifications": True,  # Add required field
                },
                "start_date": datetime.now(timezone.utc),  # Add required field
                "end_date": datetime.now(timezone.utc),  # Add required field
                "status": ExamStatus.PUBLISHED,  # Add required field
                "security_settings": {  # Add required field
                    "shuffle_questions": False,
                    "allow_review": True,
                    "prevent_tab_switching": False,
                },
                "notification_settings": {  # Add required field
                    "reminder_enabled": True,
                    "reminders": ["24h", "1h"],
                },
                "max_attempts": 1,
                "passing_score": 70,
            },
            "current_status": StudentExamStatus.NOT_STARTED,
            "attempts_count": 0,
        }

        mock_service.return_value = [BaseGetStudentExamSchema.model_validate(mock_data)]

        response = await client.get("/v1/exam/student/exams", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Exams retrieved successfully"
        assert len(response.json()["data"]) == 1

    @patch("app.exam.student.services.StudentExamService.get_student_exam")
    async def test_get_student_exam(
        self, mock_service, client, auth_headers, test_student_exam
    ):
        """Test getting a specific exam for a student"""
        # Mock return value with properly structured data
        exam_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        # Create a valid schema instance with all required fields
        mock_data = {
            "id": test_student_exam.id,
            "exam_instance_id": {
                "id": exam_id,
                "title": "Test Exam",
                "created_by": {
                    "id": user_id,
                    "email": "teacher@example.com",
                    "first_name": "Test",
                    "last_name": "Teacher",
                    "role": UserRole.TEACHER,  # Add required field
                    "receive_notifications": True,  # Add required field
                },
                "start_date": datetime.now(timezone.utc),  # Add required field
                "end_date": datetime.now(timezone.utc),  # Add required field
                "status": ExamStatus.PUBLISHED,  # Add required field
                "security_settings": {  # Add required field
                    "shuffle_questions": False,
                    "allow_review": True,
                    "prevent_tab_switching": False,
                },
                "notification_settings": {  # Add required field
                    "reminder_enabled": True,
                    "reminders": ["24h", "1h"],
                },
                "max_attempts": 1,
                "passing_score": 70,
            },
            "current_status": StudentExamStatus.NOT_STARTED,
            "attempts_count": 0,
            "attempts": [],
            "last_attempt_id": None,
        }

        mock_service.return_value = DetailGetStudentExamSchema.model_validate(mock_data)

        response = await client.get(
            f"/v1/exam/student/exams/{test_student_exam.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam retrieved successfully"
        assert response.json()["data"]["id"] == test_student_exam.id

    @patch("app.exam.student.services.StudentExamService.get_student_attempt")
    async def test_get_student_attempt(
        self, mock_service, client, auth_headers, test_student_attempt
    ):
        """Test getting a specific attempt for a student"""
        # Mock return value for the service method
        mock_service.return_value = CurrentAttemptSchema(
            id=test_student_attempt.id,
            status=StudentExamStatus.IN_PROGRESS,
            started_at=datetime.now(timezone.utc),
            submitted_at=None,
            grade=None,
            pass_fail=None,
            question_order=["q1", "q2", "q3"],
            responses=[],
            security_events=[],
        )

        response = await client.get(
            f"/v1/exam/student/exam/{test_student_attempt.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Attempt retrieved successfully"
        assert response.json()["data"]["id"] == test_student_attempt.id

    @patch("app.exam.student.services.StudentExamService.start_exam")
    async def test_start_exam(
        self, mock_service, client, auth_headers, test_student_exam
    ):
        """Test starting an exam"""
        # Mock return value for the service method
        mock_service.return_value = [
            BaseQuestionSchema(
                id="q1",
                question_text="What is 2+2?",
                type="mcq",
                has_katex=False,
                options=[
                    {"id": "opt1", "text": "3"},
                    {"id": "opt2", "text": "4"},
                    {"id": "opt3", "text": "5"},
                ],
            )
        ]

        response = await client.post(
            f"/v1/exam/student/exam/{test_student_exam.id}/start", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam started successfully"
        assert len(response.json()["data"]) == 1

    @patch("app.exam.student.services.StudentExamService.save_answer")
    async def test_save_answer(
        self, mock_service, client, auth_headers, test_student_exam
    ):
        """Test saving an answer"""
        # Prepare test data
        save_answer_data = {"question_id": "q1", "option_ids": ["opt2"]}

        response = await client.put(
            f"/v1/exam/student/exam/{test_student_exam.id}/save_answer",
            json=save_answer_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Answer saved successfully"

    @patch("app.exam.student.services.StudentExamService.toggle_flag_question")
    async def test_toggle_flag_question(
        self, mock_service, client, auth_headers, test_student_exam
    ):
        """Test toggling flag on a question"""
        # Prepare test data
        flag_data = {"question_id": "q1"}

        response = await client.put(
            f"/v1/exam/student/exam/{test_student_exam.id}/toggle_flag_question",
            json=flag_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Question flagged successfully"

    @patch("app.exam.student.services.StudentExamService.submit_exam")
    async def test_submit_exam(
        self, mock_service, client, auth_headers, test_student_exam
    ):
        """Test submitting an exam"""
        # Mock return value for the service method
        mock_service.return_value = StudentAttemptBasicSchema(
            id=str(uuid.uuid4()),
            status=StudentExamStatus.SUBMITTED,
            started_at=datetime.now(timezone.utc),
            submitted_at=datetime.now(timezone.utc),
            grade=85.0,
            pass_fail=PassFailStatus.PASS,
        )

        response = await client.post(
            f"/v1/exam/student/exam/{test_student_exam.id}/submit", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Exam submitted successfully"
        assert response.json()["data"]["status"] == "submitted"
