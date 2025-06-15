from typing import Any, Dict, List

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.settings import settings

mail_config = ConnectionConfig(
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
    TEMPLATE_FOLDER=settings.BASE_DIR / "celery/tasks/email_tasks/templates",
)

mail = FastMail(mail_config)


def create_message(
    recipients: List[str], subject: str, body: Dict[str, Any] | None = None
) -> MessageSchema:
    if body is None:
        body = {}
    message = MessageSchema(
        recipients=recipients,
        subject=subject,
        template_body=body,
        subtype=MessageType.html,
    )
    return message
