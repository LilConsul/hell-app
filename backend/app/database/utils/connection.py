from app.settings import settings
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


async def get_database() -> AsyncIOMotorDatabase:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    return client[settings.MONGO_DATABASE]
