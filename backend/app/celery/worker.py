from celery import Celery

from app.settings import settings

celery = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.autodiscover_tasks(["app.celery.tasks.email_tasks.tasks"])
