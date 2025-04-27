from fastapi import APIRouter

from app.users.router import router as users_router
from app.auth.router import router as auth_router
from app.exam.router import router as exam_router
from app.admin.router import router as admin_router

router = APIRouter(prefix="/v1")

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(exam_router)
router.include_router(admin_router)
