from datetime import datetime

from app.celery.worker import celery
from asgiref.sync import async_to_sync

from .manager import create_message, mail


@celery.task
def user_verify_mail_event(recipient: str, link: str, username: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject="Hell App | Verify Your Email",
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
        subject="Hell App | Reset Your Password",
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
    username: str,
    date_registered: str,
):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject="Hell App | Welcome to Hell App",
        body={
            "datetime": date_registered,
            "username": username,
            "year": datetime.now().year,
        },
    )
    async_to_sync(mail.send_message)(message, "welcome.html")


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
