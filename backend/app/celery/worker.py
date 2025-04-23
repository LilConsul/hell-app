from app.settings import settings
from celery import Celery

celery = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.autodiscover_tasks(["app.celery.tasks.email_tasks.tasks"])
