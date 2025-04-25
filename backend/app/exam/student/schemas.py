from app.auth.schemas import UserResponse
from app.exam.models import StudentExamStatus
from app.exam.teacher.schemas import ExamInstanceBase
from pydantic import BaseModel, ConfigDict


class ExamInstanceBaseEtc(ExamInstanceBase):
    id: str
    created_by: UserResponse


class BaseStudentExamSchema(BaseModel):
    id: str
    exam_instance_id: ExamInstanceBaseEtc
    current_status: StudentExamStatus
    # last_attempt:
    attempts_count: int
    # attempt:

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CreateStudentExamSchema(BaseStudentExamSchema):
    pass
