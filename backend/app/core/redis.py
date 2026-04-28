import redis.asyncio as redis
from app.core.config import settings

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL)
    return redis_client

async def add_blacklist(token: str, expire_seconds: int):
    try:
        client = get_redis_client()
        await client.setex(
            f"blacklist:{token}",
            expire_seconds,
            "1"
        )
    except Exception:
        pass  

async def is_blacklisted(token: str) -> bool:
    try:
        client = get_redis_client()
        result = await client.get(f"blacklist:{token}")
        return result is not None
    except Exception:
        return False  