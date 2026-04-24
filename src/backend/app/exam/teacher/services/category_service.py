from typing import List

from app.auth.models import UserRole
from app.core.exceptions import ForbiddenError, NotFoundError
from app.exam.repository import CategoryRepository
from app.exam.teacher.schemas import CreateCategory, GetCategory, UpdateCategory
from app.i18n import _


class CategoryService:
    def __init__(self, category_repository: CategoryRepository):
        self.category_repository = category_repository

    @staticmethod
    def _is_admin(user_role: str | UserRole | None) -> bool:
        return user_role in {UserRole.ADMIN, UserRole.ADMIN.value}

    @staticmethod
    def _extract_id(obj) -> str | None:
        if obj is None:
            return None
        if hasattr(obj, "ref") and getattr(obj.ref, "id", None):
            return obj.ref.id
        if hasattr(obj, "id"):
            return obj.id
        if isinstance(obj, dict):
            return obj.get("id") or obj.get("_id") or obj.get("$id")
        if isinstance(obj, str):
            return obj
        return str(obj)

    def _ensure_manage_permission(
        self,
        category,
        user_id: str,
        user_role: str | UserRole | None,
    ) -> None:
        if self._extract_id(category.created_by) == user_id or self._is_admin(user_role):
            return
        raise ForbiddenError(_("You do not have permission to manage this category"))

    async def create_category(self, user_id: str, category_data: CreateCategory) -> str:
        payload = category_data.model_dump()
        payload["created_by"] = user_id
        category = await self.category_repository.create(payload)
        return category.id

    async def get_teacher_categories(self, user_id: str) -> List[GetCategory]:
        categories = await self.category_repository.get_all(
            {"created_by._id": user_id},
            fetch_fields={"created_by": 1},
        )
        return [GetCategory.model_validate(category.model_dump()) for category in categories]

    async def get_category(
        self,
        category_id: str,
        user_id: str,
        user_role: str | UserRole | None,
    ) -> GetCategory:
        category = await self.category_repository.get_by_id(
            category_id,
            fetch_fields={"created_by": 1},
        )
        if not category:
            raise NotFoundError(_("Category not found"))

        self._ensure_manage_permission(category, user_id, user_role)
        return GetCategory.model_validate(category.model_dump())

    async def update_category(
        self,
        category_id: str,
        user_id: str,
        user_role: str | UserRole | None,
        category_data: UpdateCategory,
    ) -> None:
        category = await self.category_repository.get_by_id(
            category_id,
            fetch_fields={"created_by": 1},
        )
        if not category:
            raise NotFoundError(_("Category not found"))

        self._ensure_manage_permission(category, user_id, user_role)

        update_data = category_data.model_dump(exclude_unset=True)
        if not update_data:
            return
        await self.category_repository.update(category_id, update_data)

    async def delete_category(
        self,
        category_id: str,
        user_id: str,
        user_role: str | UserRole | None,
    ) -> None:
        category = await self.category_repository.get_by_id(
            category_id,
            fetch_fields={"created_by": 1},
        )
        if not category:
            raise NotFoundError(_("Category not found"))

        self._ensure_manage_permission(category, user_id, user_role)
        await self.category_repository.delete(category_id)

