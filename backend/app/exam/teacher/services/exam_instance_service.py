from datetime import datetime, timedelta, timezone
from typing import List

from app.auth.repository import UserRepository
from app.celery.tasks.email_tasks.tasks import exam_reminder_notification
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.utils import make_username
from app.exam.models import ExamStatus, NotificationSettings
from app.exam.repository import (
    CollectionRepository,
    ExamInstanceRepository,
    StudentExamRepository,
)
from app.exam.teacher.schemas import (
    CreateExamInstanceSchema,
    GetExamInstance,
    UpdateExamInstanceSchema,
)
from app.settings import settings


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

    async def _validate_students_exist(self, students: List[dict]) -> None:
        """Check if all students exist in the user repository."""
        for student in students:
            student_id = student.get("student_id")
            if student_id:
                user = await self.user_repository.get_by_id(student_id)
                if not user:
                    raise NotFoundError(f"Student with ID {student_id} not found")

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

        if not collection.questions:
            raise NotFoundError(
                "Collection does not contain any questions. Please add questions to the collection before creating an exam instance."
            )

        instance_data = instance_data.model_dump()
        instance_data["created_by"] = user_id
        await self.check_datetime(
            instance_data["start_date"], instance_data["end_date"]
        )

        students = instance_data.get("assigned_students", [])
        if students:
            await self._validate_students_exist(students)

        exam_instance = await self.exam_instance_repository.create(instance_data)

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

            # Validate that all new students exist
            await self._validate_students_exist(new_students)

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
                    instance.start_date
                    if "start_date" not in update_data
                    else start_date,
                    instance.end_date if "end_date" not in update_data else end_date,
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
