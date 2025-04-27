from fastapi import APIRouter
from fastapi.params import Depends

from app.auth.dependencies import get_current_admin_id

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin_id)]
)

@router.get("/users",)
async def get_users():
    """
    Get all users
    """
    return {"message": "Get all users"}
