import uuid
from datetime import datetime, timedelta, timezone
from typing import List

from app.auth.repository import UserRepository
from app.celery.tasks.email_tasks.tasks import exam_reminder_notification
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.utils import make_username
from app.exam.models import ExamStatus, NotificationSettings, QuestionType
from app.exam.repository import (
    CollectionRepository,
    ExamInstanceRepository,
    QuestionRepository,
    StudentExamRepository,
)
from app.exam.teacher.schemas import (
    CreateCollection,
    CreateExamInstanceSchema,
    GetCollection,
    GetExamInstance,
    CollectionNoQuestions,
    QuestionSchema,
    UpdateCollection,
    UpdateExamInstanceSchema,
    UpdateQuestionSchema,
    CollectionQuestionCount,
)
from app.settings import settings


class CollectionService:
    def __init__(
        self,
        collection_repository: CollectionRepository,
        question_repository: QuestionRepository,
    ):
        self.collection_repository = collection_repository
        self.question_repository = question_repository

    async def create_collection(
        self, collection_data: CreateCollection, user_id: str
    ) -> str:
        """Create a new collection, returning the collection ID."""
        collection_data = collection_data.model_dump()
        collection_data["created_by"] = user_id

        collection = await self.collection_repository.create(collection_data)
        return collection.id

    async def get_collection(self, user_id: str, collection_id: str) -> GetCollection:
        """Get a collection by its ID."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError("Collection not found")

        is_owner = user_id and collection.created_by.id == user_id
        is_public = collection.status == ExamStatus.PUBLISHED

        if not (is_owner or is_public):
            raise ForbiddenError("You don't have access to this collection")

        return collection.model_dump()

    async def update_collection(
        self, collection_id: str, user_id: str, collection_data: UpdateCollection
    ) -> None:
        """Update a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by.ref.id != user_id:
            raise ForbiddenError("You do not own this collection")

        update_data = collection_data.model_dump(exclude_unset=True)
        await self.collection_repository.update(collection_id, update_data)

    async def delete_collection(self, collection_id: str, user_id: str) -> None:
        """Delete a collection by its ID."""
        collection = await self.collection_repository.get_by_id(collection_id)
        if not collection:
            raise NotFoundError("Collection not found")
        if collection.created_by.ref.id != user_id:
            raise ForbiddenError("You do not own this collection")

        await self.collection_repository.delete(collection_id)

    def _validate_question_by_type(self, question_data: dict) -> None:
        """
        Validate question data based on its type.

        Args:
            question_data: The question data to validate

        Raises:
            ValueError: If the question data is invalid for its type
        """
        question_type = question_data.get("type")
        if not question_type:
            raise ValueError("Question type is required")

        # For MCQ and SINGLECHOICE: validate options
        if question_type in [QuestionType.MCQ, QuestionType.SINGLECHOICE]:
            options = question_data.get("options", [])
            if not options:
                raise ValueError(f"{question_type} question must have options")

            # Check for correct answers
            correct_count = sum(1 for opt in options if opt.get("is_correct"))

            if correct_count == 0:
                raise ValueError(
                    f"{question_type} question must have at least one correct answer"
                )

            if question_type == QuestionType.SINGLECHOICE and correct_count > 1:
                raise ValueError(
                    f"{QuestionType.SINGLECHOICE} question must have exactly one correct answer"
                )

        # For SHORTANSWER: validate correct_input_answer
        elif question_type == QuestionType.SHORTANSWER:
            if not question_data.get("correct_input_answer"):
                raise ValueError(
                    f"{QuestionType.SHORTANSWER} question must have a correct_input_answer"
                )

    async def add_question_to_collection(
        self, collection_id: str, user_id: str, question_data: QuestionSchema
    ) -> str:
        """Add a question to a collection and return the question ID."""
        collection = await self.collection_repository.get_by_id(
            collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError(f"Collection with ID {collection_id} not found")

        if collection.created_by.id != user_id:
            raise ForbiddenError(
                "You don't have permission to add questions to this collection"
            )

        # Prepare question data
        question_data_dict = question_data.model_dump()
        question_data_dict["_id"] = str(uuid.uuid4())
        question_data_dict["created_by"] = user_id

        if "options" in question_data_dict:
            question_data_dict["options"] = [
                {
                    "id": str(uuid.uuid4()),
                    "text": opt["text"],
                    "is_correct": opt["is_correct"],
                }
                for opt in question_data_dict["options"]
            ]

        self._validate_question_by_type(question_data_dict)

        # Create question
        question = await self.question_repository.create(question_data_dict)
        collection.questions.append(question)
        await self.collection_repository.save(collection)

        return question.id

    async def edit_question(
        self, question_id: str, user_id: str, question_data: UpdateQuestionSchema
    ) -> None:
        """Edit an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_links=True
        )
        if not question:
            raise NotFoundError("Question not found")

        # Check if user owns the question
        if question.created_by.id != user_id:
            raise ForbiddenError("You do not own this question")

        update_data = question_data.model_dump(exclude_unset=True)
        if "_id" in update_data:
            del update_data["_id"]

        if "options" in update_data:
            update_data["options"] = [
                {
                    "id": str(uuid.uuid4()),
                    "text": opt["text"],
                    "is_correct": opt["is_correct"],
                }
                for opt in update_data["options"]
            ]

        merged_data = question.model_dump()
        merged_data.update(update_data)

        self._validate_question_by_type(merged_data)

        # Update the question
        await self.question_repository.update(question_id, update_data)

    async def get_teacher_collections(
        self, user_id: str
    ) -> List[CollectionQuestionCount] | []:
        """Get all collections created by a specific teacher."""
        collections = await self.collection_repository.get_by_creator(user_id)
        return await self._process_collections(collections)

    async def get_public_collections(self) -> List[CollectionQuestionCount] | []:
        """Get all published collections that are publicly available."""
        collections = await self.collection_repository.get_published()
        return await self._process_collections(collections)

    @staticmethod
    async def _process_collections(collections) -> List[CollectionQuestionCount] | []:
        """Process collection data and add question count."""
        result = []
        for collection in collections:
            collection_dict = collection.model_dump()
            collection_dict["question_count"] = (
                len(collection.questions)
                if hasattr(collection, "questions") and collection.questions
                else 0
            )
            result.append(CollectionQuestionCount.model_validate(collection_dict))
        return result

    async def delete_question(self, question_id: str, user_id: str) -> None:
        """Delete an existing question by its ID."""
        question = await self.question_repository.get_by_id(
            question_id, fetch_links=True
        )
        if not question:
            raise NotFoundError("Question not found")

        if question.created_by.id != user_id:
            raise ForbiddenError("You do not own this question")

        collections = await self.collection_repository.get_all()
        for collection in collections:
            if question in collection.questions:
                collection.questions.remove(question)
                await self.collection_repository.save(collection)

        await self.question_repository.delete(question_id)


class ExamInstanceService:
    def __init__(
        self,
        exam_instance_repository: ExamInstanceRepository,
        collection_repository: CollectionRepository,
        user_repository: UserRepository,
        student_exam_repository: StudentExamRepository,
    ):
        self.exam_instance_repository = exam_instance_repository
        self.collection_repository = collection_repository
        self.user_repository = user_repository
        self.student_exam_repository = student_exam_repository

    async def get_by_creator(self, user_id: str) -> List[GetExamInstance]:
        """Get all exam instances created by a specific teacher."""
        instances = await self.exam_instance_repository.get_all(
            {"created_by._id": user_id}, fetch_links=True
        )

        return [await self._process_instance(instance) for instance in instances]

    async def get_by_id(self, user_id: str, instance_id: str) -> GetExamInstance:
        """Get an exam instance by its ID."""
        instance = await self.exam_instance_repository.get_by_field(
            "_id", instance_id, fetch_links=True
        )

        if not instance:
            raise NotFoundError("Exam instance not found")

        if not (user_id and instance.created_by.id == user_id):
            raise ForbiddenError("You don't have access to this exam instance")

        return await self._process_instance(instance)

    async def _process_instance(self, instance) -> GetExamInstance:
        data = instance.model_dump()

        data["assigned_students"] = await self._process_assigned_students(
            data.get("assigned_students", [])
        )
        data["collection_id"] = self._extract_id(data.get("collection_id"))
        data["created_by"] = self._extract_id(data.get("created_by"))

        return GetExamInstance.model_validate(data)

    async def _process_assigned_students(self, students: list) -> list:
        result = []
        for student in students:
            if "student_id" in student:
                sid = await self._extract_student_id(student["student_id"])
                result.append({"student_id": sid})
        return result

    @staticmethod
    def _extract_id(obj):
        if isinstance(obj, str):
            return obj
        if isinstance(obj, dict):
            return obj.get("id") or obj.get("_id")
        return str(obj)

    @staticmethod
    async def _extract_student_id(student_obj):
        if hasattr(student_obj, "fetch"):
            try:
                return (await student_obj.fetch()).id
            except Exception:
                return str(student_obj)
        if isinstance(student_obj, dict):
            return student_obj.get("_id", str(student_obj))
        return str(student_obj)

    async def _send_notification(
        self,
        users_id: List[dict],
        reminders: List[str],
        exam_title: str,
        exam_start_time: datetime,
        exam_end_time: datetime,
        exam_instance_id: str,
    ) -> None:
        # Convert reminder strings to timedeltas (e.g. "24h" -> 24 hours before exam)
        reminder_times = []
        for reminder in reminders:
            if reminder.endswith("h"):
                hours = int(reminder[:-1])
                reminder_times.append(timedelta(hours=hours))
            elif reminder.endswith("m"):
                minutes = int(reminder[:-1])
                reminder_times.append(timedelta(minutes=minutes))
            elif reminder.endswith("d"):
                days = int(reminder[:-1])
                reminder_times.append(timedelta(days=days))

        current_time = datetime.now(timezone.utc)
        for user_id in users_id:
            user = await self.user_repository.get_by_id(user_id["student_id"])
            if user is None or not user.receive_notifications:
                continue

            # Assuming we have a link, which looks like this:
            # https://localhost/exam/{id}
            link = settings.EXAM_INSTANCE_URL
            link = link.format(id=exam_instance_id)
            data = {
                "recipient": user.email,
                "username": make_username(user),
                "exam_title": exam_title,
                "start_time": exam_start_time,
                "end_time": exam_end_time,
                "link": link,
            }
            # Send notification immediately
            exam_reminder_notification.apply_async(kwargs=data)

            exam_id_str = str(exam_instance_id)
            if exam_id_str not in user.notifications_tasks_id:
                user.notifications_tasks_id[exam_id_str] = []

            for delta in reminder_times:
                notification_time = exam_start_time - delta
                if notification_time > current_time:
                    result = exam_reminder_notification.apply_async(
                        kwargs=data, eta=notification_time
                    )
                    user.notifications_tasks_id[exam_id_str].append(result.id)
            await self.user_repository.save(user)

    async def _create_student_exam(
        self, users_id: List[dict], exam_instance_id: str
    ) -> None:
        """Create a new StudentExam instance."""
        for user_id in users_id:
            student_exam_data = {
                "student_id": user_id["student_id"],
                "exam_instance_id": exam_instance_id,
            }
            await self.student_exam_repository.create(student_exam_data)

    async def _add_students_to_exam(
        self,
        students: List[dict],
        exam_instance_id: str,
        exam_title: str,
        start_date: datetime,
        end_date: datetime,
        notification_settings: dict,
    ) -> None:
        """Add students to an exam instance, create StudentExam instances, and send notifications."""
        await self._create_student_exam(students, exam_instance_id)

        if (
            notification_settings["reminder_enabled"]
            and notification_settings["reminders"]
        ):
            await self._send_notification(
                students,
                notification_settings["reminders"],
                exam_title,
                start_date,
                end_date,
                exam_instance_id,
            )

    async def _remove_students_from_exam(
        self, students: List[dict], exam_instance_id: str
    ) -> None:
        """
        Remove students from an exam instance, delete their StudentExam instances,
        and revoke any pending notification tasks.
        """
        for student in students:
            student_exam = await self.student_exam_repository.get_by_student_and_exam(
                student["student_id"], exam_instance_id
            )
            if student_exam:
                await self.student_exam_repository.delete(student_exam.id)

            user = await self.user_repository.get_by_id(student["student_id"])
            exam_id_str = str(exam_instance_id)
            if user and exam_id_str in user.notifications_tasks_id:
                task_ids = user.notifications_tasks_id[exam_id_str]
                for task_id in task_ids:
                    exam_reminder_notification.AsyncResult(task_id).revoke(
                        terminate=True
                    )

                del user.notifications_tasks_id[exam_id_str]
                await self.user_repository.save(user)

    @staticmethod
    async def check_datetime(
        start_date: datetime,
        end_date: datetime,
    ):
        """Check if the start and end dates are valid."""
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)

        if start_date < datetime.now(timezone.utc):
            raise ForbiddenError("Start date must be in the future")
        if end_date < start_date:
            raise ForbiddenError("End date must be after start date")

    async def create_exam_instance(
        self,
        user_id: str,
        instance_data: CreateExamInstanceSchema,
    ) -> str:
        """Create a new exam instance."""
        collection = await self.collection_repository.get_by_id(
            instance_data.collection_id, fetch_links=True
        )
        if not collection:
            raise NotFoundError("Collection not found")

        is_owner = user_id and collection.created_by.id == user_id
        is_public = collection.status == ExamStatus.PUBLISHED

        if not (is_owner or is_public):
            raise ForbiddenError("You do not have access to this collection")

        instance_data = instance_data.model_dump()
        instance_data["created_by"] = user_id
        await self.check_datetime(
            instance_data["start_date"], instance_data["end_date"]
        )

        exam_instance = await self.exam_instance_repository.create(instance_data)

        students = instance_data.get("assigned_students", [])
        if students:
            await self._add_students_to_exam(
                students,
                exam_instance.id,
                instance_data["title"],
                instance_data["start_date"],
                instance_data["end_date"],
                instance_data.get("notification_settings", NotificationSettings()),
            )

        return exam_instance.id

    async def update_exam_instance(
        self,
        user_id: str,
        instance_id: str,
        instance_data: UpdateExamInstanceSchema,
    ) -> None:
        """Update an existing exam instance."""
        instance = await self.exam_instance_repository.get_by_id(
            instance_id, fetch_links=True
        )
        if not instance:
            raise NotFoundError("Exam instance not found")

        if instance.created_by.id != user_id:
            raise ForbiddenError("You do not own this exam instance")
        update_data = instance_data.model_dump(exclude_unset=True)

        if "start_date" in update_data and "end_date" in update_data:
            start_date = update_data["start_date"]
            end_date = update_data["end_date"]
            await self.check_datetime(start_date, end_date)

        if "assigned_students" in update_data:
            current_students = [
                {"student_id": await self._extract_student_id(student.student_id)}
                for student in instance.assigned_students
            ]

            new_students = update_data.get("assigned_students", [])

            current_student_ids = {
                student["student_id"] for student in current_students
            }
            new_student_ids = {student["student_id"] for student in new_students}

            added_students = [
                student
                for student in new_students
                if student["student_id"] not in current_student_ids
            ]

            removed_students = [
                student
                for student in current_students
                if student["student_id"] not in new_student_ids
            ]

            if added_students:
                await self._add_students_to_exam(
                    added_students,
                    instance_id,
                    instance.title,
                    start_date,
                    end_date,
                    instance.notification_settings.model_dump(),
                )

            if removed_students:
                await self._remove_students_from_exam(removed_students, instance_id)

        await self.exam_instance_repository.update(instance_id, update_data)

    async def delete_exam_instance(self, user_id: str, instance_id: str) -> None:
        """Delete an existing exam instance."""
        instance = await self.exam_instance_repository.get_by_id(instance_id)
        if not instance:
            raise NotFoundError("Exam instance not found")

        if instance.created_by.ref.id != user_id:
            raise ForbiddenError("You do not own this exam instance")

        if instance.assigned_students:
            students = [
                {"student_id": await self._extract_student_id(student.student_id)}
                for student in instance.assigned_students
            ]
            await self._remove_students_from_exam(students, instance_id)

        await self.exam_instance_repository.delete(instance_id)
