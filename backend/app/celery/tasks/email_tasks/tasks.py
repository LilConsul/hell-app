from app.celery.worker import celery
from asgiref.sync import async_to_sync

from .manager import create_message, mail


@celery.task
def user_verify_mail_event(recipient: str, link: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject="Verify Your Email",
        body={"link": link},
    )
    async_to_sync(mail.send_message)(message, "verify.html")


@celery.task
def user_password_reset_mail(recipient: str, link: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject="Reset Your Password",
        body={"link": link},
    )
    async_to_sync(mail.send_message)(message, "password_reset.html")


@celery.task
def user_register_mail_event(recipient: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject="Welcome to Our Service",
    )
    async_to_sync(mail.send_message)(message, "register.html")


@celery.task
def exam_reminder_notification(
    recipient: str,
    username: str,
    exam_title: str,
    start_time: str,
    link: str | None = None,
):
    message = create_message(
        recipients=[recipient],
        subject=f"Reminder: {exam_title} Exam",
        body={
            "username": username,
            "exam_title": exam_title,
            "start_time": start_time,
            "link": link,
        },
    )
    async_to_sync(mail.send_message)(message, "exam_reminder.html")
