from fastapi import APIRouter

from .auth.router import router as auth_router
from .exam.router import router as exam_router

router = APIRouter(prefix="/v1")

router.include_router(auth_router)
router.include_router(exam_router)
