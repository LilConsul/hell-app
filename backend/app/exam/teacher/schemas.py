from datetime import datetime
from typing import List

from app.auth.schemas import UserResponse
from app.exam.models import (
    ExamInstance,
    ExamStatus,
    NotificationSettings,
    QuestionType,
    SecuritySettings,
)
from pydantic import BaseModel, ConfigDict


class TimeStamp(BaseModel):
    created_at: datetime
    updated_at: datetime


class QuestionOptionSchema(BaseModel):
    id: str | None = None
    text: str
    is_correct: bool = False


class QuestionBase(BaseModel):
    question_text: str
    type: QuestionType
    has_katex: bool = False
    weight: int = 1
    options: List[QuestionOptionSchema] | None = []
    correct_input_answer: str | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class QuestionSchema(QuestionBase):
    id: str | None = None


class CreateQuestionSchema(QuestionBase):
    pass


class UpdateQuestionSchema(BaseModel):
    question_text: str | None = None
    type: QuestionType | None = None
    has_katex: bool | None = None
    options: List[QuestionOptionSchema] | None = None
    correct_input_answer: str | None = None
    weight: int | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CollectionBase(BaseModel):
    title: str
    description: str | None = None
    status: ExamStatus = ExamStatus.DRAFT

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CreateCollection(CollectionBase):
    pass


class UpdateCollection(BaseModel):
    title: str | None = None
    description: str | None = None
    status: ExamStatus | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class GetCollection(CollectionBase, TimeStamp):
    id: str
    created_by: UserResponse
    questions: List[QuestionSchema]


class JustCollection(GetCollection):
    questions: None = None


class UserId(BaseModel):
    student_id: str


class ExamInstanceBase(BaseModel):
    title: str
    start_date: datetime
    end_date: datetime
    status: ExamStatus
    max_attempts: int = 1
    passing_score: int = 50
    security_settings: SecuritySettings
    notification_settings: NotificationSettings

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CreateExamInstanceSchema(ExamInstanceBase):
    collection_id: str
    assigned_students: List[UserId] | None = None


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
