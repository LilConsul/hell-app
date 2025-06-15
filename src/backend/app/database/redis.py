import redis.asyncio as redis

from app.settings import settings


async def get_redis_client():
    """Get Redis client as a dependency"""
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
