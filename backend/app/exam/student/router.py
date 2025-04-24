from app.auth.dependencies import get_current_student_id
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/student",
    tags=["exam/student"],
    dependencies=[Depends(get_current_student_id)],
)


@router.get("/")
def hello():
    return {"message": "Hello from Student"}
