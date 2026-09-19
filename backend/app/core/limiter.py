"""Rate limiting for abuse-prone endpoints (OTP send/verify, login).

Uses in-memory storage by default — fine for a single backend instance, but
each instance would then track its own separate counters. Setting
`REDIS_URL` switches slowapi/`limits` to a shared Redis-backed store so the
limit is enforced consistently across multiple instances behind a load
balancer.
"""
import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

logger = logging.getLogger("takeoff.limiter")

if settings.REDIS_URL:
    logger.info("Rate limiter using Redis storage")
    limiter = Limiter(
        key_func=get_remote_address,
        enabled=settings.RATE_LIMIT_ENABLED,
        storage_uri=settings.REDIS_URL,
    )
else:
    logger.info("Rate limiter using in-memory storage (set REDIS_URL to share across instances)")
    limiter = Limiter(key_func=get_remote_address, enabled=settings.RATE_LIMIT_ENABLED)
