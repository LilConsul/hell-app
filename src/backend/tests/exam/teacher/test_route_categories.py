import uuid
from unittest.mock import patch

import jwt
import pytest

from app.auth.models import User
from app.auth.schemas import UserRole
from app.auth.security import get_password_hash
from app.exam.models import Category
from app.settings import settings


class TestTeacherCategoryRouter:
    @pytest.fixture
    async def teacher_user(self, fake):
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
        token = jwt.encode(
            {"sub": str(teacher_user.id), "role": teacher_user.role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        return {"Authorization": f"Bearer {token}"}

    @patch("app.exam.teacher.services.CategoryService.create_category")
    async def test_create_category(self, mock_service, client, auth_headers):
        mock_service.return_value = str(uuid.uuid4())

        response = await client.post(
            "/v1/exam/teacher/categories/",
            json={"name": "Math", "description": "Math topics"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        assert response.json()["message"] == "Category created successfully"

    @patch("app.exam.teacher.services.CategoryService.get_teacher_categories")
    async def test_get_categories(self, mock_service, client, auth_headers):
        mock_service.return_value = [
            {
                "id": str(uuid.uuid4()),
                "name": "Math",
                "description": "Math topics",
                "created_at": "2026-01-01T00:00:00",
                "updated_at": "2026-01-01T00:00:00",
            }
        ]

        response = await client.get("/v1/exam/teacher/categories/", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["message"] == "Categories retrieved successfully"
        assert len(response.json()["data"]) == 1

    @patch("app.exam.teacher.services.CategoryService.update_category")
    async def test_update_category(self, mock_service, client, auth_headers):
        response = await client.put(
            f"/v1/exam/teacher/categories/{uuid.uuid4()}",
            json={"name": "Updated"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Category updated successfully"

    @patch("app.exam.teacher.services.CategoryService.delete_category")
    async def test_delete_category(self, mock_service, client, auth_headers):
        response = await client.delete(
            f"/v1/exam/teacher/categories/{uuid.uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Category deleted successfully"

    async def test_create_category_real_document(self, client, auth_headers, teacher_user):
        response = await client.post(
            "/v1/exam/teacher/categories/",
            json={"name": "Science"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        category_id = response.json()["data"]["category_id"]

        category = await Category.find_one(Category.id == category_id)
        assert category is not None
        assert category.created_by.ref.id == str(teacher_user.id)

