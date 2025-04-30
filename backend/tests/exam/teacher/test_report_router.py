import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.teacher.schemas import (
    ExamReportResponse,
    ExamStatistics,
    HistogramDataPoint,
    TimelineDataPoint,
)
from app.settings import settings


class TestReportRouter:
    """Integration tests for teacher report endpoints"""

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
    def exam_instance_id(self):
        """Return a mock exam instance ID"""
        return str(uuid.uuid4())

    async def test_unauthorized_access(self, client):
        """Test unauthorized access to report endpoint"""
        exam_id = str(uuid.uuid4())
        response = await client.get(f"/v1/exam/teacher/report/{exam_id}")
        assert response.status_code == 401

    @patch("app.exam.teacher.services.ReportService.get_exam_report")
    async def test_get_exam_report_basic(
        self, mock_service, client, auth_headers, exam_instance_id
    ):
        """Test basic report retrieval with no filters"""
        mock_report = ExamReportResponse(
            exam_title="Test Exam",
            total_students=10,
            attempts_count=15,
            statistics=ExamStatistics(
                mean=75.5,
                median=78.0,
                max=98.0,
                min=45.0,
            ),
            pass_rate=80.0,
            histogram_data=[
                HistogramDataPoint(range="40-49", count=1),
                HistogramDataPoint(range="70-79", count=3),
                HistogramDataPoint(range="90-100", count=1),
            ],
            timeline_data=[
                TimelineDataPoint(date="2023-01-01", average_score=72.5),
                TimelineDataPoint(date="2023-01-02", average_score=78.3),
            ],
        )
        mock_service.return_value = mock_report

        response = await client.get(
            f"/v1/exam/teacher/report/{exam_instance_id}", headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Exam report retrieved successfully"
        data = response.json()["data"]
        assert data["exam_title"] == "Test Exam"
        assert data["total_students"] == 10
        assert data["pass_rate"] == 80.0

    @patch("app.exam.teacher.services.ReportService.get_exam_report")
    async def test_get_exam_report_with_filters(
        self, mock_service, client, auth_headers, exam_instance_id
    ):
        """Test report retrieval with all filters applied"""
        mock_report = ExamReportResponse(
            exam_title="Test Exam",
            total_students=3,
            attempts_count=3,
            statistics=ExamStatistics(
                mean=82.3,
                median=85.0,
                max=95.0,
                min=67.0,
            ),
            pass_rate=100.0,
            histogram_data=[
                HistogramDataPoint(range="60-69", count=1),
                HistogramDataPoint(range="90-100", count=1),
            ],
            timeline_data=[
                TimelineDataPoint(date="2023-01-15", average_score=82.3),
            ],
        )
        mock_service.return_value = mock_report

        start_date = datetime.now(timezone.utc) - timedelta(days=7)
        end_date = datetime.now(timezone.utc)
        student_ids = f"{str(uuid.uuid4())},{str(uuid.uuid4())}"
        title = "Test Exam"

        response = await client.get(
            f"/v1/exam/teacher/report/{exam_instance_id}",
            headers=auth_headers,
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "student_ids": student_ids,
                "title": title,
                "only_last_attempt": False,
            },
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["total_students"] == 3
        assert data["attempts_count"] == 3

    @patch("app.exam.teacher.services.ReportService.get_exam_report")
    async def test_get_exam_report_empty_results(
        self, mock_service, client, auth_headers, exam_instance_id
    ):
        """Test report retrieval with filters that return empty results"""
        mock_report = ExamReportResponse(
            exam_title="Test Exam",
            total_students=0,
            attempts_count=0,
            statistics=ExamStatistics(),
        )
        mock_service.return_value = mock_report

        response = await client.get(
            f"/v1/exam/teacher/report/{exam_instance_id}",
            headers=auth_headers,
            params={"title": "Non-existent Exam"},
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["total_students"] == 0
        assert data["attempts_count"] == 0
        assert data["statistics"] == {
            "mean": None,
            "median": None,
            "max": None,
            "min": None,
        }

    @patch("app.exam.teacher.services.ReportService.get_exam_report")
    async def test_get_exam_report_service_error(
        self, mock_service, client, auth_headers, exam_instance_id
    ):
        """Test handling of service errors"""
        from app.core.exceptions import NotFoundError

        mock_service.side_effect = NotFoundError("Exam instance not found")

        response = await client.get(
            f"/v1/exam/teacher/report/{exam_instance_id}", headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()