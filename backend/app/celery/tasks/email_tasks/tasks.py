from asgiref.sync import async_to_sync

from ...worker import celery
from .manager import create_message, mail


@celery.task
def user_verify_mail_event(recipient: str, subject: str, link: str):
    message = create_message(
        recipients=[
            recipient,
        ],
        subject=subject,
        body={"link": link},
    )
    async_to_sync(mail.send_message)(message, "mail/verify.html")


# def user_password_reset_mail(recipient: str, subject: str, link: str):
#     message = create_message(
#         recipients=[
#             recipient,
#         ],
#         subject=subject,
#         body={"link": link},
#     )
#     async_to_sync(mail.send_message)(message, "mail/password_reset.html")
