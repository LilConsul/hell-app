from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_teacher_id

router = APIRouter(
    prefix="/exam-instances",
    dependencies=[Depends(get_current_teacher_id)],
)


@router.get("/")
async def root():
    return {"message": "Hello World"}