from typing import List

from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_teacher_id, get_decode_token
from app.auth.models import UserRole
from app.core.schemas import BaseReturn
from app.exam.teacher.dependencies import get_category_service
from app.exam.teacher.schemas import CreateCategory, GetCategory, UpdateCategory
from app.exam.teacher.services import CategoryService
from app.i18n import _


router = APIRouter(prefix="/categories", dependencies=[Depends(get_current_teacher_id)])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CreateCategory,
    teacher_id: str = Depends(get_current_teacher_id),
    category_service: CategoryService = Depends(get_category_service),
):
    category_id = await category_service.create_category(teacher_id, category_data)
    return BaseReturn(
        message=_("Category created successfully"), data={"category_id": category_id}
    )


@router.get("/", response_model=BaseReturn[List[GetCategory]])
async def get_teacher_categories(
    teacher_id: str = Depends(get_current_teacher_id),
    category_service: CategoryService = Depends(get_category_service),
):
    categories = await category_service.get_teacher_categories(teacher_id)
    return BaseReturn(message=_("Categories retrieved successfully"), data=categories)


@router.get("/{category_id}", response_model=BaseReturn[GetCategory])
async def get_category(
    category_id: str,
    teacher_id: str = Depends(get_current_teacher_id),
    token_data: dict = Depends(get_decode_token),
    category_service: CategoryService = Depends(get_category_service),
):
    category = await category_service.get_category(
        category_id,
        teacher_id,
        token_data.get("role", UserRole.TEACHER),
    )
    return BaseReturn(message=_("Category retrieved successfully"), data=category)


@router.put("/{category_id}", response_model=BaseReturn)
async def update_category(
    category_id: str,
    category_data: UpdateCategory,
    teacher_id: str = Depends(get_current_teacher_id),
    token_data: dict = Depends(get_decode_token),
    category_service: CategoryService = Depends(get_category_service),
):
    await category_service.update_category(
        category_id,
        teacher_id,
        token_data.get("role", UserRole.TEACHER),
        category_data,
    )
    return BaseReturn(message=_("Category updated successfully"))


@router.delete("/{category_id}", response_model=BaseReturn)
async def delete_category(
    category_id: str,
    teacher_id: str = Depends(get_current_teacher_id),
    token_data: dict = Depends(get_decode_token),
    category_service: CategoryService = Depends(get_category_service),
):
    await category_service.delete_category(
        category_id,
        teacher_id,
        token_data.get("role", UserRole.TEACHER),
    )
    return BaseReturn(message=_("Category deleted successfully"))
