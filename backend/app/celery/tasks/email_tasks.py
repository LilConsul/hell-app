from typing import Any, Dict, List

from app.settings import settings
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import BaseModel, EmailStr

from ..worker import celery

# Configuration for email
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_USER,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.EMAIL_FROM_NAME,
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=settings.BASE_DIR / "celery/templates",
)


class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: Dict[str, Any]


@celery.task
def send_email_task(email_data: dict):
    """Celery task to send email asynchronously"""
    # Convert dict back to our schema
    email_schema = EmailSchema(**email_data)

    # Create message
    message = MessageSchema(
        subject=email_schema.subject,
        recipients=email_schema.email,
        template_body=email_schema.body,
        subtype="html",
    )

    # Initialize FastMail
    fm = FastMail(conf)

    # Send email (we use synchronous method since this is already in a background task)
    fm.send_message(message, template_name="email.html")

    return {"status": "Email has been sent"}