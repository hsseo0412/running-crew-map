import logging
import time

import redis as redis_lib

from app.core.config import settings

logger = logging.getLogger(__name__)

CACHE_KEY_CREWS_LIST = "crews:list"
CACHE_TTL = 60  # seconds

_RETRY_COOLDOWN = 30  # Redis 연결 실패 후 재시도 대기 시간 (초)

_client: redis_lib.Redis | None = None
_last_failure_at: float = 0.0


def get_redis() -> redis_lib.Redis | None:
    """Redis 클라이언트 싱글턴 반환. 연결 실패 시 None 반환 (Fallback).
    실패 후 30초 동안은 재시도하지 않아 매 요청 타임아웃을 방지한다."""
    global _client, _last_failure_at
    if _client is not None:
        return _client
    if time.time() - _last_failure_at < _RETRY_COOLDOWN:
        return None
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
        _last_failure_at = time.time()
    return _client
