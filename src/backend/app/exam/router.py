from fastapi import APIRouter

from .student.router import router as student_router
from .teacher.router import router as examinators_router

router = APIRouter(prefix="/exam")


router.include_router(student_router)
router.include_router(examinators_router)
