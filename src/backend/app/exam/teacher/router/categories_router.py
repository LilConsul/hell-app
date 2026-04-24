from typing import List

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_teacher_id
from app.core.schemas import BaseReturn
from app.exam.dependencies import get_category_repository
from app.exam.models import Collection
from app.exam.repository import CategoryRepository
from app.exam.teacher.schemas import CategoryResponse
from app.i18n import _

router = APIRouter(
    prefix="/categories",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.get("/", response_model=BaseReturn[List[CategoryResponse]])
async def get_all_categories(
    category_repo: CategoryRepository = Depends(get_category_repository),
):
    """
    Get all categories with collection count.
    
    Available for teachers and administrators.
    """
    categories = await category_repo.get_all()
    
    # Add collection count for each category
    result = []
    for category in categories:
        # Fetch all collections and count those with this category
        all_collections = await Collection.find_all(fetch_links=True).to_list()
        count = sum(
            1 for col in all_collections 
            if any(cat.name == category.name for cat in col.categories)
        )
        
        result.append(
            CategoryResponse(
                name=category.name,
                created_at=category.created_at,
                updated_at=category.updated_at,
                collection_count=count
            )
        )
    
    return BaseReturn(
        message=_("Categories retrieved successfully"),
        data=result,
    )
