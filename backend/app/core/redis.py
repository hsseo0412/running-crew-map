import logging

import redis as redis_lib

from app.core.config import settings

logger = logging.getLogger(__name__)

CACHE_KEY_CREWS_LIST = "crews:list"
CACHE_TTL = 60  # seconds

_client: redis_lib.Redis | None = None


def get_redis() -> redis_lib.Redis | None:
    """Redis 클라이언트 싱글턴 반환. 연결 실패 시 None 반환 (Fallback)."""
    global _client
    if _client is None:
        try:
            _client = redis_lib.Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1,
            )
            _client.ping()
            logger.info("Redis connected: %s", settings.redis_url)
        except Exception as e:
            logger.warning("Redis unavailable, cache disabled: %s", e)
            _client = None
    return _client
