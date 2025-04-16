from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.settings import settings


async def get_database() -> AsyncIOMotorDatabase:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    return client[settings.MONGO_DATABASE]
