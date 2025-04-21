from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict

from app.auth.schemas import UserResponse
from app.exam.models import (
    ExamStatus,
    QuestionType,
    NotificationSettings,
    SecuritySettings, ExamInstance,
)


class TimeStamp(BaseModel):
    created_at: datetime
    updated_at: datetime


class QuestionOptionSchema(BaseModel):
    id: str | None = None
    text: str
    is_correct: bool = False


class QuestionSchema(BaseModel):
    id: str | None = None
    question_text: str
    type: QuestionType
    has_katex: bool = False
    options: List[QuestionOptionSchema] | None = []  # For mcq or one choice questions
    correct_input_answer: str | None = None  # For short answer questions
    weight: int = 1

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CreateQuestionSchema(QuestionSchema):
    id: None


class UpdateQuestionSchema(CreateQuestionSchema):
    question_text: str | None = None
    type: QuestionType | None = None
    has_katex: bool | None = None
    options: List[QuestionOptionSchema] | None = None  # For mcq or one choice questions
    correct_input_answer: str | None = None  # For short answer questions
    weight: int | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CreateCollection(BaseModel):
    title: str
    description: str | None = None
    status: ExamStatus = ExamStatus.DRAFT

    model_config = ConfigDict(arbitrary_types_allowed=True)


class UpdateCollection(BaseModel):
    title: str | None = None
    description: str | None = None
    status: ExamStatus | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class GetCollection(CreateCollection, TimeStamp):
    id: str
    created_by: UserResponse
    questions: List[QuestionSchema]

    model_config = ConfigDict(arbitrary_types_allowed=True)


class JustCollection(GetCollection):
    questions: None = None

class UserId(BaseModel):
    student_id: str

class CreateExamInstanceSchema(BaseModel):
    collection_id: str
    title: str
    start_date: datetime
    end_date: datetime
    status: ExamStatus
    max_attempts: int = 1
    passing_score: int = 50
    security_settings: SecuritySettings
    notification_settings: NotificationSettings
    assigned_students: List[UserId] | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

class UpdateExamInstanceSchema(BaseModel):
    title: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: ExamStatus | None = None
    max_attempts: int | None = None
    passing_score: int | None = None
    security_settings: SecuritySettings | None = None
    notification_settings: NotificationSettings | None = None
    assigned_students: List[UserId] | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

class GetExamInstance(ExamInstance):
    collection_id: str
    created_by: str
    assigned_students: List[UserId] | None = None

