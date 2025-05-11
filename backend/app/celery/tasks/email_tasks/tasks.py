from datetime import datetime

from app.celery.worker import celery
from asgiref.sync import async_to_sync

from app.settings import settings
from .manager import create_message, mail
from celery import signals


@celery.task
def user_verify_mail_event(recipient: str, link: str, username: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Verify Your Email",
        body={
            "verification_link": link,
            "username": username,
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "verify.html")


@celery.task
def user_password_reset_mail(recipient: str, link: str, username: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Reset Your Password",
        body={
            "reset_link": link,
            "username": username,
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "password_reset.html")


@celery.task
def user_welcome_mail_event(
    recipient: str,
    date_registered: str,
    username: str,
):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Welcome to {settings.PROJECT_NAME}",
        body={
            "login_link": settings.LOGIN_URL,
            "datetime": date_registered,
            "username": username,
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "welcome.html")


@celery.task(bind=True)
def exam_reminder_notification(
    self,
    recipient: str,
    username: str,
    exam_title: str,
    start_time: datetime,
    end_time: datetime,
    link: str,
    exam_instance_id: str = None,
):
    duration = int((end_time - start_time).total_seconds() / 60)
    subject = (
        f"{settings.PROJECT_NAME} | Reminder: {exam_title}"
        if any(
            word in exam_title.lower()
            for word in ["exam", "test", "quiz", "assessment"]
        )
        else f"{settings.PROJECT_NAME} | Reminder: {exam_title} Exam"
    )
    message = create_message(
        recipients=[recipient],
        subject=subject,
        body={
            "username": username,
            "exam_title": exam_title,
            "start_time": start_time.strftime("%Y-%m-%d %H:%M"),
            "duration": str(str(duration) + " minutes"),
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "exam_link": link,
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "exam_reminder.html")


@signals.task_postrun.connect(sender=exam_reminder_notification)
def exam_reminder_notification_post(sender, **kwargs):
    task_id = kwargs.get("task_id")
    exam_instance_id = kwargs.get("kwargs", {}).get("exam_instance_id")
    recipient = kwargs.get("kwargs", {}).get("recipient")

    if not (task_id and exam_instance_id and recipient):
        return

    from pymongo import MongoClient
    from app.settings import settings
    import logging

    try:
        client = MongoClient(settings.MONGODB_URL)
        db = client[settings.MONGO_DATABASE]
        users_collection = db["users"]

        user = users_collection.find_one({"email": recipient})
        if not user:
            return

        exam_id_str = str(exam_instance_id)
        notifications = user.get("notifications_tasks_id", {})
        if exam_id_str in notifications and task_id in notifications[exam_id_str]:
            notifications[exam_id_str].remove(task_id)

            if not notifications[exam_id_str]:
                del notifications[exam_id_str]

            users_collection.update_one(
                {"email": recipient},
                {"$set": {"notifications_tasks_id": notifications}},
            )
    except Exception as e:
        logging.error(f"Error in exam_reminder_notification_post: {e}")
    finally:
        if "client" in locals():
            client.close()


@celery.task
def user_deletion_confirmation(
    recipient: str,
    username: str,
    date_registered: datetime,
    link: str,
):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Account Deletion Confirmation",
        body={
            "datetime": date_registered.strftime("%Y-%m-%d %H:%M"),
            "username": username,
            "deletion_link": link,
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "request_deletion.html")


@celery.task
def user_deleted_notification(
    recipient: str,
    username: str,
    date_registered: datetime,
):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Thanks for being with us :(",
        body={
            "datetime": date_registered.strftime("%Y-%m-%d %H:%M"),
            "username": username,
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "account_deleted.html")


@celery.task
def exam_finish_confirmation(
    recipient: str,
    username: str,
    exam_title: str,
    end_time: datetime,
    start_time: datetime = None,
    question_count: int = None,
):
    duration = "N/A"
    if start_time:
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        duration = f"{duration_minutes} minutes"

    message = create_message(
        recipients=[
            recipient,
        ],
        subject=f"{settings.PROJECT_NAME} | Exam Submitted Successfully",
        body={
            "username": username,
            "exam_title": exam_title,
            "completion_time": end_time.strftime("%Y-%m-%d %H:%M"),
            "duration": duration,
            "question_count": question_count or "N/A",
            "dashboard_link": settings.DASHBOARD_URL,
            "datetime": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "exam_finished.html")
