from app.auth.dependencies import get_current_teacher_id
from app.exam.teacher.collections_router import router as collections_router
from app.exam.teacher.exam_instance_router import router as exam_instance_router

# from app.exam.teacher.report_router import router as report_router
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/teacher",
    tags=["exam/teacher"],
    dependencies=[Depends(get_current_teacher_id)],
)

router.include_router(collections_router)
router.include_router(exam_instance_router)
# router.include_router(report_router)
