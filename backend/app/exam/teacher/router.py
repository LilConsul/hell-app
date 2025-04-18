from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_teacher_id
from app.exam.teacher.collections_router import router as collections_router

router = APIRouter(
    prefix="/teacher",
    tags=["exam/teacher"],
    dependencies=[Depends(get_current_teacher_id)],
)

# Include the collections router
router.include_router(collections_router)