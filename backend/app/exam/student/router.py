from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_student_id

router = APIRouter(
    prefix="/student",
    tags=["exam/student"],
    dependencies=[Depends(get_current_student_id)],
)


@router.get("/")
def hello():
    return {"message": "Hello from Student"}
