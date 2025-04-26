import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from app.auth.models import User
from app.auth.schemas import UserRole
from app.database.mixins import TimestampMixin
from beanie import BackLink, Delete, Document, Link, before_event
from pydantic import BaseModel, ConfigDict, Field


class QuestionType(str, Enum):
    MCQ = "mcq"
    SINGLECHOICE = "singlechoice"
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


class ImageModel(BaseModel, TimestampMixin):
    file_id: Optional[str] = None  # GridFS file ID
    alt: Optional[str] = None
    caption: Optional[str] = None
    filename: Optional[str] = None
    content_type: Optional[str] = None
    size: Optional[int] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class QuestionOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    is_correct: bool = False


class SecuritySettings(BaseModel):
    # Shuffle questions and options
    shuffle_questions: bool = False

    # Allow students to check their answers after submission
    allow_review: bool = True

    # Browser security settings
    prevent_tab_switching: bool = False
    tab_switch_limit: Optional[int] = None

    # Gaze tracking, requires webcam access
    gaze_tracking: bool = False
    gaze_limit: Optional[int] = None


class NotificationSettings(BaseModel):
    reminder_enabled: bool = True
    reminders: List[str] | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reminder_enabled": True,
                "reminders": ["2d", "1h", "20m"],
            }
        },
    )


class StudentAssignment(BaseModel):
    student_id: Link[User]

    # Notification settings for this student
    notified: bool = False
    notification_timestamp: Optional[datetime] = None


class SecurityEvent(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: Dict[str, Any] = Field(default_factory=dict)


class Question(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    type: QuestionType
    created_by: Link[User]  # Reference to the user, must be teacher
    has_katex: bool = False
    # images: List[ImageModel] = Field(default_factory=list)
    options: List[QuestionOption] = Field(default_factory=list)
    correct_input_answer: Optional[str] = None  # For short answer questions
    weight: int = 1

    # Relationship with collections that use this question
    collection: BackLink["Collection"] = Field(
        json_schema_extra={"original_field": "questions"},
    )

    class Settings:
        name = "questions"
        use_state_management = True
        indexes = [
            "created_by",
            "type",
        ]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "question_text": "What is the capital of France?",
                "type": "mcq",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",  # User ID
                "has_katex": False,
                "options": [
                    {"id": "opt1", "text": "Paris", "is_correct": True},
                    {"id": "opt2", "text": "London", "is_correct": False},
                ],
                "correct_input_answer": None,
                "weight": 1,
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        },
    )


class Collection(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    created_by: Link[User]  # Reference to the user, must be teacher
    status: ExamStatus = ExamStatus.DRAFT

    # List of question IDs - using Link for proper relationships
    questions: List[Link[Question]] = Field(default_factory=list)

    class Settings:
        name = "collections"
        use_state_management = True
        indexes = [
            "created_by",
            "status",
        ]

    @before_event(Delete)
    async def before_delete(self):
        """Delete all questions linked to this collection when the collection is deleted"""
        question_ids = []
        for q in self.questions:
            question_obj = await q.fetch()
            question_ids.append(question_obj.id)
        if question_ids:
            await Question.find({"_id": {"$in": question_ids}}).delete()

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                "title": "Geography Quiz",
                "description": "Test your knowledge of world capitals",
                "created_by": "550e8400-e29b-41d4-a716-446655440001",
                "status": "draft",
                "questions": [],
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        },
    )


class ExamInstance(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    collection_id: Link[Collection]
    title: str
    created_by: Link[User]
    start_date: datetime
    end_date: datetime
    status: ExamStatus = ExamStatus.DRAFT
    max_attempts: int = 1
    passing_score: int = 50  # Percentage
    security_settings: SecuritySettings = Field(default_factory=SecuritySettings)
    notification_settings: NotificationSettings = Field(
        default_factory=NotificationSettings
    )
    assigned_students: List[StudentAssignment] = Field(default_factory=list)

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
        arbitrary_types_allowed=True,
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
                "security_settings": {
                    "allow_review": True,
                    "shuffle_questions": True,
                    "allow_skipping_questions": False,
                    "prevent_tab_switching": False,
                    "tab_switch_limit": None,
                    "gaze_tracking": False,
                    "gaze_limit": None,
                },
                "notification_settings": {
                    "reminder_enabled": True,
                    "reminders": ["24h", "1h"],
                },
                "assigned_students": [],
                "created_at": "2025-04-16T11:01:29.000Z",
                "updated_at": "2025-04-16T11:01:29.000Z",
            }
        },
    )


class StudentResponse(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    attempt_id: Link["StudentAttempt"]  # Back reference to parent attempt
    question_id: Link[Question]
    selected_option_ids: List[str] = Field(default_factory=list)
    text_response: Optional[str] = None
    score: float = -1.0  # Default to -1 for ungraded
    is_flagged: bool = False
    option_order: Dict[str, int] = Field(
        default_factory=dict
    )  # Maps option_id -> position

    class Settings:
        name = "student_responses"
        use_state_management = True
        indexes = ["attempt_id", "question_id", "score"]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440004",
                "attempt_id": "550e8400-e29b-41d4-a716-446655440005",
                "question_id": "550e8400-e29b-41d4-a716-446655440000",
                "selected_option_ids": ["opt1"],
                "text_response": None,
                "score": 1.0,
                "is_flagged": False,
                "option_order": {"opt1": 2, "opt2": 0, "opt3": 1},
                "created_at": "2025-04-20T09:15:30.000Z",
                "updated_at": "2025-04-20T09:15:30.000Z",
            }
        },
    )


class StudentAttempt(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_exam_id: Link["StudentExam"]
    status: StudentExamStatus = StudentExamStatus.NOT_STARTED
    security_events: List[SecurityEvent] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    pass_fail: Optional[PassFailStatus] = None
    graded_at: Optional[datetime] = None
    last_auto_save: Optional[datetime] = None
    question_order: List[str] = Field(default_factory=list)

    responses: List[BackLink[StudentResponse]] = Field(
        default_factory=list, json_schema_extra={"original_field": "attempt_id"}
    )

    class Settings:
        name = "student_attempts"
        use_state_management = True
        indexes = ["student_exam_id", "status", "grade"]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440005",
                "student_exam_id": "550e8400-e29b-41d4-a716-446655440006",
                "status": "in_progress",
                "security_events": [
                    {
                        "timestamp": "2025-04-20T09:10:15.000Z",
                        "details": {"event_type": "browser_focus_lost"},
                    }
                ],
                "started_at": "2025-04-20T09:00:10.000Z",
                "submitted_at": None,
                "grade": None,
                "pass_fail": None,
                "graded_at": None,
                "last_auto_save": "2025-04-20T09:14:30.000Z",
                "question_order": [
                    "550e8400-e29b-41d4-a716-446655440010",
                    "550e8400-e29b-41d4-a716-446655440011",
                    "550e8400-e29b-41d4-a716-446655440012",
                ],
                "created_at": "2025-04-20T09:00:10.000Z",
                "updated_at": "2025-04-20T09:14:30.000Z",
            }
        },
    )


class StudentExam(Document, TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_instance_id: Link[ExamInstance]
    student_id: Link[User]
    current_status: StudentExamStatus = StudentExamStatus.NOT_STARTED  # Overall status
    latest_attempt_id: Link[StudentAttempt] | None = (
        None
    )
    attempts_count: int = 0

    attempts: List[BackLink[StudentAttempt]] = Field(
        default_factory=list, json_schema_extra={"original_field": "student_exam_id"}
    )

    class Settings:
        name = "student_exams"
        use_state_management = True
        indexes = ["exam_instance_id", "student_id", "current_status"]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440006",
                "exam_instance_id": "550e8400-e29b-41d4-a716-446655440003",
                "student_id": "550e8400-e29b-41d4-a716-446655440007",
                "current_status": "in_progress",
                "latest_attempt_id": "550e8400-e29b-41d4-a716-446655440005",
                "attempts_count": 1,
                "created_at": "2025-04-19T14:30:00.000Z",
                "updated_at": "2025-04-20T09:00:10.000Z",
            }
        },
    )


async def cascade_delete_user(user_id: str, role: UserRole):
    """
    Cascade delete all data related to a user when they're deleted.
    """
    # Delete all questions created by the user (can be teacher or admin)
    if role == UserRole.TEACHER or role == UserRole.ADMIN:
        await Collection.find(Collection.created_by.id == user_id).delete()
        await ExamInstance.find(ExamInstance.created_by.id == user_id).delete()

    # Delete all student exams and responses
    if role == UserRole.STUDENT:
        # TODO: Implement this logic
        pass

    print(f"Deleted all data related to user {user_id}")
