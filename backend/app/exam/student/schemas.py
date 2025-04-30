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
    """
    Basic question option schema without correctness information.
    Used when displaying options to students during an exam.
    """
    id: str
    text: str

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class QuestionOptionFull(QuestionOptionBase):
    """
    Complete question option schema including correctness information.
    Used when reviewing exam results or for teacher view.
    """
    is_correct: bool

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Question schemas
class QuestionBase(BaseModel):
    """
    Base question schema with core properties.
    Used as foundation for other question schemas.
    """
    id: str
    question_text: str
    type: QuestionType
    has_katex: bool = False
    weight: int = 1

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class QuestionWithOptions(QuestionBase):
    """
    Question schema with options but without correctness information.
    Used when displaying questions to students during an exam.
    """
    options: List[QuestionOptionBase] | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class QuestionFull(QuestionBase):
    """
    Complete question schema with all data including correct answers.
    Used when reviewing exam results or for teacher view.
    """
    options: List[QuestionOptionFull] | None = None
    correct_input_answer: str | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class QuestionWithUserResponse(QuestionWithOptions):
    """
    Question schema that includes user response data.
    Used when reloading an exam to show previous answers.
    """
    user_selected_options: List[str] = []
    user_text_response: Optional[str] = None
    is_flagged: bool = False

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Exam instance schemas
class ExamInstanceBasic(ExamInstanceBase):
    """
    Basic exam instance data visible to students.
    Used when displaying exam information in student views.
    """
    id: str
    created_by: UserResponse

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Student exam schemas
class StudentExamBase(BaseModel):
    """
    Basic information about a student's exam assignment.
    Used for listing exams assigned to a student.
    """
    id: str
    exam_instance_id: ExamInstanceBasic
    current_status: StudentExamStatus
    attempts_count: int

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class StudentExamDetail(StudentExamBase):
    """
    Detailed information about a student's exam including attempts.
    Used for detailed view of an exam for a student.
    """
    latest_attempt_id: Optional[str] = None
    attempts: List["StudentAttemptBasic"] = []

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Attempt schemas
class StudentAttemptBase(BaseModel):
    """
    Base schema for exam attempt information.
    Contains basic timing and status data.
    """
    id: str
    status: StudentExamStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class StudentAttemptBasic(StudentAttemptBase):
    """
    Basic attempt information including grade.
    Used when showing attempt results without detailed answers.
    """
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class StudentAttemptDetail(StudentAttemptBase):
    """
    Detailed attempt information including question order and security events.
    Used for detailed attempt information and monitoring.
    """
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None
    question_order: List[str] = []
    security_events: List[SecurityEvent] = []

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Response schemas
class StudentResponseBase(BaseModel):
    """
    Student's response to a question in an exam.
    Used to record and display a student's answers.
    """
    id: str
    question_id: QuestionFull
    selected_option_ids: List[str] = []
    text_response: Optional[str] = None
    score: float = -1.0
    is_flagged: bool = False
    option_order: Dict[str, int] = {}

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class ReviewResponse(StudentResponseBase):
    """
    Response schema with correctness information.
    Used when reviewing completed exam attempts.
    """
    is_correct: bool = False
    correct_option_ids: List[str] = []
    correct_text_answer: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Request schemas
class QuestionIdentifier(BaseModel):
    """
    Simple schema to identify a question by ID.
    Used in API requests that need to reference a specific question.
    """
    question_id: str

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class AnswerSubmission(QuestionIdentifier):
    """
    Schema for submitting an answer to a question.
    Used for saving answers during an exam session.
    """
    answer: str | None = None
    option_ids: List[str] | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


# Combined schemas for API responses
class CurrentAttempt(StudentAttemptDetail):
    """
    Complete attempt with all student responses.
    Used for tracking and displaying the current exam attempt.
    """
    responses: List[StudentResponseBase] = []

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class ReviewAttempt(StudentAttemptDetail):
    """
    Complete attempt with review information including correct answers.
    Used for reviewing a completed exam attempt.
    """
    responses: List[ReviewResponse] = []
    allow_review: bool = True

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)