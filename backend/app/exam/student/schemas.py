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


class BaseQuestionOptionSchema(BaseModel):
    id: str
    text: str


class FullQuestionOptionSchema(BaseQuestionOptionSchema):
    is_correct: bool


class BaseQuestionSchema(BaseModel):
    id: str
    question_text: str
    type: QuestionType
    has_katex: bool = False
    options: List[BaseQuestionOptionSchema] | None = None
    weight: int = 1


class FullQuestionSchema(BaseQuestionSchema):
    options: List[FullQuestionOptionSchema] | None = None
    correct_input_answer: str | None = None


class StudentResponseSchema(BaseModel):
    id: str
    question_id: FullQuestionSchema
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


class DetailGetStudentExamSchema(BaseGetStudentExamSchema):
    latest_attempt_id: Optional[str] = None
    attempts: List[StudentAttemptBasicSchema] = []


class CurrentAttemptSchema(StudentAttemptBasicSchema):
    question_order: List[str] = []
    responses: List[StudentResponseSchema] = []
    security_events: List[SecurityEvent] = []


class QuestionBaseSchema(BaseModel):
    question_id: str


class QuestionSetAnswer(QuestionBaseSchema):
    answer: str | None = None
    option_ids: List[str] | None = None


class ReviewResponseSchema(StudentResponseSchema):
    """Schema for responses when review is allowed, showing correct answers"""

    is_correct: bool = False
    correct_option_ids: List[str] = []
    correct_text_answer: Optional[str] = None


class ReviewAttemptSchema(CurrentAttemptSchema):
    """Schema for an attempt when review is allowed"""

    responses: List[ReviewResponseSchema] = []
    allow_review: bool = True
