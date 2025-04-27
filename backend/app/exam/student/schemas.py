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


# Option schemas
class QuestionOptionBase(BaseModel):
    id: str
    text: str


class QuestionOptionFull(QuestionOptionBase):
    is_correct: bool


# Question schemas
class QuestionBase(BaseModel):
    id: str
    question_text: str
    type: QuestionType
    has_katex: bool = False
    weight: int = 1


class QuestionWithOptions(QuestionBase):
    options: List[QuestionOptionBase] | None = None


class QuestionFull(QuestionBase):
    options: List[QuestionOptionFull] | None = None
    correct_input_answer: str | None = None


# Exam instance schemas
class ExamInstanceBasic(ExamInstanceBase):
    id: str
    created_by: UserResponse


# Student exam schemas
class StudentExamBase(BaseModel):
    id: str
    exam_instance_id: ExamInstanceBasic
    current_status: StudentExamStatus
    attempts_count: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


class StudentExamDetail(StudentExamBase):
    latest_attempt_id: Optional[str] = None
    attempts: List["StudentAttemptBasic"] = []


# Attempt schemas
class StudentAttemptBase(BaseModel):
    id: str
    status: StudentExamStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None


class StudentAttemptBasic(StudentAttemptBase):
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None


class StudentAttemptDetail(StudentAttemptBase):
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None
    question_order: List[str] = []
    security_events: List[SecurityEvent] = []


# Response schemas
class StudentResponseBase(BaseModel):
    id: str
    question_id: QuestionFull
    selected_option_ids: List[str] = []
    text_response: Optional[str] = None
    score: float = -1.0
    is_flagged: bool = False
    option_order: Dict[str, int] = {}


class ReviewResponse(StudentResponseBase):
    is_correct: bool = False
    correct_option_ids: List[str] = []
    correct_text_answer: Optional[str] = None


# Request schemas
class QuestionIdentifier(BaseModel):
    question_id: str


class AnswerSubmission(QuestionIdentifier):
    answer: str | None = None
    option_ids: List[str] | None = None


# Combined schemas for API responses
class CurrentAttempt(StudentAttemptDetail):
    responses: List[StudentResponseBase] = []


class ReviewAttempt(StudentAttemptDetail):
    responses: List[ReviewResponse] = []
    allow_review: bool = True


# Aliases for backward compatibility
BaseGetStudentExamSchema = StudentExamBase
DetailGetStudentExamSchema = StudentExamDetail
BaseQuestionOptionSchema = QuestionOptionBase
FullQuestionOptionSchema = QuestionOptionFull
BaseQuestionSchema = QuestionWithOptions
FullQuestionSchema = QuestionFull
StudentAttemptBasicSchema = StudentAttemptBasic
StudentResponseSchema = StudentResponseBase
QuestionBaseSchema = QuestionIdentifier
QuestionSetAnswer = AnswerSubmission
ReviewResponseSchema = ReviewResponse
CurrentAttemptSchema = CurrentAttempt
ReviewAttemptSchema = ReviewAttempt
