import redis.asyncio as redis
from app.core.config import settings


redis_client = redis.from_url(settings.REDIS_URL)

async def add_blacklist(token:str, expire_seconds:int):
    await redis_client.setex(
        f"blacklist:{token}",
        expire_seconds,
        "1"
    )


async def is_blacklisted(token:str)->bool:
    result = await redis_client.get(f"blacklist:{token}")
    return result is not None