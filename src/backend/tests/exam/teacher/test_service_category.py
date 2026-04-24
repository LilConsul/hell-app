import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.models import UserRole
from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.repository import CategoryRepository
from app.exam.teacher.schemas import CreateCategory, UpdateCategory
from app.exam.teacher.services.category_service import CategoryService


class TestCategoryService:
    @pytest.fixture
    def category_repository(self):
        return AsyncMock(spec=CategoryRepository)

    @pytest.fixture
    def service(self, category_repository):
        return CategoryService(category_repository)

    @pytest.fixture
    def user_id(self):
        return str(uuid.uuid4())

    @pytest.fixture
    def other_user_id(self):
        return str(uuid.uuid4())

    @pytest.fixture
    def category_id(self):
        return str(uuid.uuid4())

    @pytest.fixture
    def mock_category(self, category_id, user_id):
        category = MagicMock()
        category.id = category_id
        category.created_by = MagicMock()
        category.created_by.ref = MagicMock()
        category.created_by.ref.id = user_id
        category.model_dump = MagicMock(
            return_value={
                "id": category_id,
                "name": "Algebra",
                "description": "Math category",
                "created_at": "2026-01-01T00:00:00",
                "updated_at": "2026-01-01T00:00:00",
            }
        )
        return category

    async def test_create_category(self, service, category_repository, user_id):
        payload = CreateCategory(name="Algebra", description="Math category")
        category_repository.create.return_value = MagicMock(id="cat-1")

        result = await service.create_category(user_id, payload)

        category_repository.create.assert_called_once()
        assert category_repository.create.call_args[0][0]["created_by"] == user_id
        assert result == "cat-1"

    async def test_get_category_not_found(self, service, category_repository, user_id):
        category_repository.get_by_id.return_value = None

        with pytest.raises(NotFoundError):
            await service.get_category("missing", user_id, UserRole.TEACHER)

    async def test_update_category_forbidden(
        self,
        service,
        category_repository,
        mock_category,
        other_user_id,
    ):
        category_repository.get_by_id.return_value = mock_category

        with pytest.raises(ForbiddenError):
            await service.update_category(
                mock_category.id,
                other_user_id,
                UserRole.TEACHER,
                UpdateCategory(name="Updated"),
            )

    async def test_update_category_admin_can_manage(
        self,
        service,
        category_repository,
        mock_category,
        other_user_id,
    ):
        category_repository.get_by_id.return_value = mock_category

        await service.update_category(
            mock_category.id,
            other_user_id,
            UserRole.ADMIN,
            UpdateCategory(name="Updated"),
        )

        category_repository.update.assert_called_once_with(
            mock_category.id,
            {"name": "Updated"},
        )

    async def test_delete_category(
        self,
        service,
        category_repository,
        mock_category,
        user_id,
    ):
        category_repository.get_by_id.return_value = mock_category

        await service.delete_category(mock_category.id, user_id, UserRole.TEACHER)

        category_repository.delete.assert_called_once_with(mock_category.id)

