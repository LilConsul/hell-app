from app.users.api import router as user_router
from fastapi import APIRouter

router = APIRouter()

router.include_router(user_router)
