from app.auth.models import User
from app.settings import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient


async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)

    await init_beanie(
        database=client.db_name,
        document_models=[
            User,
        ],
    )
