import json
import logging

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self._cache = {}
        try:
            import redis
            import os
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                self.redis = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.redis.ping()
                self.use_redis = True
                logger.info("Connected to Redis successfully.")
            else:
                self.use_redis = False
                logger.info("REDIS_URL not set. Falling back to in-memory dict cache.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis. Falling back to in-memory dict cache. Error: {e}")
            self.use_redis = False

    def get(self, key: str):
        if self.use_redis:
            try:
                val = self.redis.get(key)
                return json.loads(val) if val else None
            except Exception:
                return None
        return self._cache.get(key)

    def set(self, key: str, value, expire: int = 3600):
        if self.use_redis:
            try:
                self.redis.setex(key, expire, json.dumps(value))
            except Exception:
                pass
        else:
            self._cache[key] = value

    def delete(self, key: str):
        if self.use_redis:
            try:
                self.redis.delete(key)
            except Exception:
                pass
        else:
            self._cache.pop(key, None)

cache_service = CacheService()
