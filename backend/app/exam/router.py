from fastapi import APIRouter

from .teacher.router import router as examinators_router
from .student.router import router as student_router

router = APIRouter(prefix="/exam")


router.include_router(student_router)
router.include_router(examinators_router)
