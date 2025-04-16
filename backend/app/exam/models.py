import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from beanie import BackLink, Document, Link
from pydantic import ConfigDict, Field, field_validator

from app.auth.models import User
from app.database.mixins import TimestampMixin


class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUEFALSE = "truefalse"
    SHORTANSWER = "shortanswer"


class ExamStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class StudentExamStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class PassFailStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"


class ImageModel(TimestampMixin):
    file_id: Optional[str] = None  # GridFS file ID
    url: Optional[str] = None  # External URL alternative
    alt: Optional[str] = None
    caption: Optional[str] = None
    filename: Optional[str] = None
    content_type: Optional[str] = None
    size: Optional[int] = None


class QuestionOption:
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    is_correct: bool = False


class SecuritySettings:
    prevent_tab_switching: bool = False
    tab_switch_limit: Optional[int] = None
    require_webcam: bool = False
    monitor_gaze: bool = False
    gaze_threshold: Optional[int] = None


class NotificationSettings:
    reminder_enabled: bool = True
    reminders: List[str] = ["24h", "1h"]


class StudentAssignment:
    student_id: Link[User]
    email: str
    notified: bool = False
    notification_timestamp: Optional[datetime] = None


class SecurityEvent:
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: Dict[str, Any] = Field(default_factory=dict)


class Question(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    type: QuestionType
    created_by: Link[User]  # Reference to the user, must be teacher
    has_katex: bool = False
    images: List[ImageModel] = Field(default_factory=list)
    options: List[QuestionOption] = Field(default_factory=list)
    correct_input_answer: Optional[str] = None  # For short answer questions
    correct_choice_answer: Optional[str] = None  # ID of correct option for MCQ
    weight: int = 1

    # Relationship with collections that use this question
    collections: List[BackLink["Collection"]] = Field(
        default_factory=list,
        json_schema_extra={
            "original_field": "questions",
        },
    )

    @field_validator("created_by")
    def validate_teacher(cls, v):
        if not hasattr(v, "role") or v.role != "teacher":
            raise ValueError("Only teachers can create questions")
        return v

    class Settings:
        name = "questions"
        use_state_management = True
        indexes = [
            "created_by",
            "type",
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "question_text": "What is the capital of France?",
                "type": "mcq",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",  # User ID
                "has_katex": False,
                "images": [],
                "options": [
                    {"id": "opt1", "text": "Paris", "is_correct": True},
                    {"id": "opt2", "text": "London", "is_correct": False},
                ],
                "weight": 1,
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        }
    )


class Collection(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    created_by: Link[User]  # Reference to user
    status: ExamStatus = ExamStatus.DRAFT

    # List of question IDs - using Link for proper relationships
    questions: List[Link[Question]] = Field(default_factory=list)

    # Back reference to exam instances created from this collection
    exam_instances: List[BackLink["ExamInstance"]] = Field(
        default_factory=list,
        json_schema_extra={
            "original_field": "collection_id",
        },
    )

    class Settings:
        name = "collections"
        use_state_management = True
        indexes = [
            "created_by",
            "status",
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "title": "Geography Quiz",
                "description": "Test your knowledge of world capitals",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",  # User ID
                "status": "draft",
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        }
    )


class ExamInstance(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    collection_id: Link[Collection]
    title: Optional[str] = None  # Optional override title
    created_by: Link[User]  # Reference to user
    start_date: datetime
    end_date: datetime
    status: ExamStatus = ExamStatus.DRAFT
    max_attempts: int = 1
    passing_score: int = 50
    randomize_questions: bool = False
    allow_review: bool = True
    security_settings: SecuritySettings = Field(default_factory=SecuritySettings)
    notification_settings: NotificationSettings = Field(
        default_factory=NotificationSettings
    )
    assigned_students: List[StudentAssignment] = Field(default_factory=list)

    # Back reference to student exams for this instance
    student_exams: List[BackLink["StudentExam"]] = Field(
        default_factory=list,
        json_schema_extra={
            "original_field": "exam_instance_id",
        },
    )

    class Settings:
        name = "exam_instances"
        use_state_management = True
        indexes = [
            "created_by",
            "collection_id",
            "status",
            ("start_date", "end_date"),  # Compound index for date range queries
            "assigned_students.student_id",  # Index for finding exams assigned to student
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "collection_id": "550e8400-e29b-41d4-a716-446655440002",
                "title": "Geography Final Exam",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",  # User ID
                "start_date": "2025-04-20T09:00:00.000Z",
                "end_date": "2025-04-20T11:00:00.000Z",
                "status": "published",
                "max_attempts": 1,
                "passing_score": 60,
                "randomize_questions": True,
                "allow_review": True,
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        }
    )


class StudentExam(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_instance_id: Link[ExamInstance]
    student_id: Link[User]  # Reference to user
    attempts: int = 1
    status: StudentExamStatus = StudentExamStatus.NOT_STARTED
    questions: List[Dict[str, Any]] = Field(
        default_factory=list
    )  # Question IDs with their order
    security_events: Dict[str, List[SecurityEvent]] = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None
    graded_at: Optional[datetime] = None
    last_auto_save: Optional[datetime] = None
    confirmation_email_sent: bool = False

    # Back reference to student responses
    responses: List[BackLink["StudentResponse"]] = Field(
        default_factory=list,
        json_schema_extra={
            "original_field": "student_exam_id",
        },
    )

    class Settings:
        name = "student_exams"
        use_state_management = True
        indexes = [
            "student_id",
            "exam_instance_id",
            "status",
            "graded_at",
            ("student_id", "exam_instance_id"),  # Compound index
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440004",
                "exam_instance_id": "550e8400-e29b-41d4-a716-446655440003",
                "student_id": "550e8400-e29b-41d4-a716-446655440005",  # Another user ID
                "attempts": 1,
                "status": "submitted",
                "started_at": "2025-04-20T09:15:00.000Z",
                "submitted_at": "2025-04-20T10:45:00.000Z",
                "grade": 85.5,
                "pass_fail": "pass",
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        }
    )


class StudentResponse(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_exam_id: Link[StudentExam]
    question_id: Link[Question]
    selected_option_ids: List[str] = Field(default_factory=list)
    text_response: Optional[str] = None
    score: float = 0
    is_flagged: bool = False
    submitted_at: Optional[datetime] = None

    class Settings:
        name = "student_responses"
        use_state_management = True
        indexes = [
            "student_exam_id",
            "question_id",
            "is_flagged",
        ]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440006",
                "student_exam_id": "550e8400-e29b-41d4-a716-446655440004",
                "question_id": "550e8400-e29b-41d4-a716-446655440000",
                "selected_option_ids": ["opt1"],
                "score": 1.0,
                "is_flagged": False,
                "submitted_at": "2025-04-20T10:20:00.000Z",
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        }
    )
