from typing import List

from app.auth.schemas import UserResponse
from app.exam.models import QuestionType, StudentExamStatus
from app.exam.teacher.schemas import ExamInstanceBase
from pydantic import BaseModel, ConfigDict


class ExamInstanceBaseEtc(ExamInstanceBase):
    id: str
    created_by: UserResponse


class BaseStudentExamSchema(BaseModel):
    id: str
    exam_instance_id: ExamInstanceBaseEtc
    current_status: StudentExamStatus
    attempts_count: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


class BaseGetStudentExamSchema(BaseStudentExamSchema):
    pass


class DetailGetStudentExamSchema(BaseGetStudentExamSchema):
    pass
    # last_attempt:
    # attempt:


class QuestionOptionForStudent(BaseModel):
    id: str
    text: str


class QuestionForStudent(BaseModel):
    id: str
    question_text: str
    type: QuestionType
    has_katex: bool = False
    options: List[QuestionOptionForStudent] | None = None
    weight: int = 1
