from app.settings import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient


async def init_db():
    from app.auth.models import User
    from app.exam.models import Collection, ExamInstance, Question

    client = AsyncIOMotorClient(settings.MONGODB_URL)

    await init_beanie(
        database=client[settings.MONGO_DATABASE],
        document_models=[
            User,
            # Exam databases
            Collection,
            Question,
            ExamInstance,
        ],
    )
