from datetime import datetime, timedelta, timezone
from typing import List, Dict

from app.auth.repository import UserRepository
from app.celery.tasks.email_tasks.tasks import exam_reminder_notification
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.utils import (
    convert_to_user_timezone,
    convert_user_timezone_to_utc,
    make_username,
)
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
from app.i18n import _
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

    async def get_by_creator(
        self, user_id: str, user_timezone=None
    ) -> List[GetExamInstance]:
        """Get all exam instances created by a specific teacher."""
        instances = await self.exam_instance_repository.get_all(
            {"created_by.$id": user_id}
        )

        return [
            await self._process_instance(instance, user_timezone)
            for instance in instances
        ]

    async def get_by_id(
        self, user_id: str, instance_id: str, user_timezone=None
    ) -> GetExamInstance:
        """Get an exam instance by its ID."""
        instance = await self.exam_instance_repository.get_by_field("_id", instance_id)

        if not instance:
            raise NotFoundError(_("Exam instance not found"))

        if not (user_id and instance.created_by.ref.id == user_id):
            raise ForbiddenError(_("You don't have access to this exam instance"))

        return await self._process_instance(instance, user_timezone)

    async def _process_instance(self, instance, user_timezone) -> GetExamInstance:
        data = instance.model_dump()

        if user_timezone:
            data["start_date"] = convert_to_user_timezone(
                data["start_date"], user_timezone
            )
            data["end_date"] = convert_to_user_timezone(data["end_date"], user_timezone)

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
                sid = self._extract_id(student["student_id"])
                result.append({"student_id": sid})
        return result

    @staticmethod
    def _extract_id(obj):
        """Extract ID from various object types."""
        if hasattr(obj, "ref"):
            return obj.ref.id
        elif isinstance(obj, dict):
            return obj.get("id") or obj.get("_id") or obj.get("$id")
        elif isinstance(obj, str):
            return obj
        return str(obj)

    async def _send_notification(
        self,
        users_id: List[dict],
        reminders: List[str],
        exam_title: str,
        exam_start_time: datetime,
        exam_end_time: datetime,
        student_exam_ids: Dict[str, str],
    ) -> None:
        # Convert reminder strings to time deltas (e.g. "24h" -> 24 hours before exam)
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

        if exam_start_time.tzinfo is None:
            exam_start_time = exam_start_time.replace(tzinfo=timezone.utc)

        # Ensure exam_end_time has timezone info
        if exam_end_time.tzinfo is None:
            exam_end_time = exam_end_time.replace(tzinfo=timezone.utc)

        for user_id in users_id:
            user = await self.user_repository.get_by_id(user_id["student_id"])
            if user is None or not user.receive_notifications:
                continue

            # Assuming we have a link, which looks like this:
            # https://localhost/exam/{id}
            link = settings.EXAM_INSTANCE_URL
            link = link.format(id=student_exam_ids[user_id["student_id"]])
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

            data["exam_instance_id"] = student_exam_ids[user_id["student_id"]]

            exam_id_str = str(student_exam_ids[user_id["student_id"]])
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
    ) -> Dict[str, str]:
        """Create a new StudentExam instance."""
        student_exam_ids = {}
        for user_id in users_id:
            student_exam_data = {
                "student_id": user_id["student_id"],
                "exam_instance_id": exam_instance_id,
            }
            data = await self.student_exam_repository.create(student_exam_data)
            student_exam_ids[user_id["student_id"]] = data.id
        return student_exam_ids

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
        student_exam_ids = await self._create_student_exam(students, exam_instance_id)
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
                student_exam_ids,
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
            if user and student_exam.id in user.notifications_tasks_id:
                task_ids = user.notifications_tasks_id[student_exam.id]
                for task_id in task_ids:
                    exam_reminder_notification.AsyncResult(task_id).revoke(
                        terminate=True
                    )

                del user.notifications_tasks_id[student_exam.id]
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
            raise ForbiddenError(_("Start date must be in the future"))
        if end_date < start_date:
            raise ForbiddenError(_("End date must be after start date"))

    async def _validate_students_exist(self, students: List[dict]) -> None:
        """Check if all students exist in the user repository."""
        for student in students:
            student_id = student.get("student_id")
            if student_id:
                user = await self.user_repository.get_by_id(student_id)
                if not user:
                    raise NotFoundError(
                        _("Student with ID {} not found").format(student_id)
                    )

    async def create_exam_instance(
        self,
        user_id: str,
        instance_data: CreateExamInstanceSchema,
        user_timezone=None,
    ) -> str:
        """Create a new exam instance."""
        collection = await self.collection_repository.get_by_id(
            instance_data.collection_id
        )
        if not collection:
            raise NotFoundError(_("Collection not found"))

        is_owner = user_id and collection.created_by.ref.id == user_id
        is_public = collection.status == ExamStatus.PUBLISHED

        if not (is_owner or is_public):
            raise ForbiddenError(_("You do not have access to this collection"))

        if not collection.questions:
            raise NotFoundError(
                _(
                    "Collection does not contain any questions. Please add questions to the collection before creating an exam instance."
                )
            )

        instance_data = instance_data.model_dump()
        instance_data["created_by"] = user_id

        if user_timezone:
            instance_data["start_date"] = convert_user_timezone_to_utc(
                instance_data["start_date"], user_timezone
            )
            instance_data["end_date"] = convert_user_timezone_to_utc(
                instance_data["end_date"], user_timezone
            )

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
        user_timezone=None,
    ) -> None:
        """Update an existing exam instance."""
        instance = await self.exam_instance_repository.get_by_id(instance_id)
        if not instance:
            raise NotFoundError(_("Exam instance not found"))

        if instance.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this exam instance"))
        update_data = instance_data.model_dump(exclude_unset=True)

        if user_timezone:
            if "start_date" in update_data:
                update_data["start_date"] = convert_user_timezone_to_utc(
                    update_data["start_date"], user_timezone
                )
            if "end_date" in update_data:
                update_data["end_date"] = convert_user_timezone_to_utc(
                    update_data["end_date"], user_timezone
                )

        if "start_date" in update_data and "end_date" in update_data:
            start_date = update_data["start_date"]
            end_date = update_data["end_date"]
            await self.check_datetime(start_date, end_date)

        if "assigned_students" in update_data:
            current_students = [
                {"student_id": self._extract_id(student.student_id)}
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
            raise NotFoundError(_("Exam instance not found"))

        if instance.created_by.ref.id != user_id:
            raise ForbiddenError(_("You do not own this exam instance"))

        processed_students = []
        for student in instance.assigned_students:
            student_id = self._extract_id(student.student_id)
            processed_students.append({"student_id": student_id})

        await self._remove_students_from_exam(processed_students, instance_id)

        await self.exam_instance_repository.delete(instance_id)
