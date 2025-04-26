from datetime import datetime
from typing import Dict, List, Optional

from app.auth.schemas import UserResponse
from app.exam.models import (
    PassFailStatus,
    QuestionType,
    SecurityEvent,
    StudentExamStatus,
)
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


class StudentResponseSchema(BaseModel):
    id: str
    question_id: str
    selected_option_ids: List[str] = []
    text_response: Optional[str] = None
    score: float = -1.0
    is_flagged: bool = False
    option_order: Dict[str, int] = {}


class StudentAttemptBasicSchema(BaseModel):
    id: str
    status: StudentExamStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None
    graded_at: Optional[datetime] = None


class DetailGetStudentExamSchema(BaseGetStudentExamSchema):
    last_attempt_id: Optional[str] = None
    attempts: List[StudentAttemptBasicSchema] = []


class CurrentAttemptSchema(StudentAttemptBasicSchema):
    question_order: List[str] = []
    responses: List[StudentResponseSchema] = []
    security_events: List[SecurityEvent] = []


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


class QuestionAnswer(BaseModel):
    id: str
    answer: str | None = None
    option_ids: List[str] | None = None
