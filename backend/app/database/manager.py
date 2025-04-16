from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.settings import settings


async def init_db():
    from app.auth.models import User

    client = AsyncIOMotorClient(settings.MONGODB_URL)

    await init_beanie(
        database=client[settings.MONGO_DATABASE],
        document_models=[
            User,
        ],
    )
