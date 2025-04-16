from datetime import datetime
from typing import List, Optional

from fastapi import File
from pydantic import BaseModel, ConfigDict

from app.exam.models import ExamStatus, Question, QuestionType


class TimeStamp(BaseModel):
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class CreateCollection(BaseModel):
    title: str
    description: Optional[str] = None
    status: ExamStatus = ExamStatus.DRAFT

    model_config = ConfigDict(arbitrary_types_allowed=True)


class GetCollection(CreateCollection, TimeStamp):
    id: str
    created_by: str
    questions: List[Question]

    model_config = ConfigDict(arbitrary_types_allowed=True)


class QuestionSchema(BaseModel):
    type: QuestionType
    # Can be one of the following:
    question_text: str | None = None
    options: List[str] | None = None

    # Corresponding to the question type
    correct_input_answer: str | None = None
    correct_choice_answer: List[str] | None = None

    has_katex: bool = False
    weight: int = 1

    # Optional: for images
    images: List[File] | None = None

    model_config = ConfigDict(arbitrary_types_allowed=True)
