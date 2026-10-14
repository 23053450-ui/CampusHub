import time
from collections import defaultdict
from typing import Callable
from fastapi import Depends, HTTPException, status
from core.security import get_current_user


def rate_limit(max_requests: int = 10, window_seconds: int = 60) -> Callable:
    """
    Dependency factory for sliding window rate limiting keyed strictly on user['id'].
    Requires a valid Supabase JWT session via get_current_user.
    """
    buckets: dict[str, list[float]] = defaultdict(list)

    async def dependency(user: dict = Depends(get_current_user)) -> None:
        user_id = user["id"]
        now = time.time()
        cutoff = now - window_seconds

        # Evict timestamps older than the sliding window
        buckets[user_id] = [t for t in buckets[user_id] if t > cutoff]

        if len(buckets[user_id]) >= max_requests:
            retry_after = int(buckets[user_id][0] + window_seconds - now)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": f"Rate limit exceeded: maximum {max_requests} requests per {window_seconds}s.",
                        "details": {"retry_after_seconds": max(1, retry_after)},
                    }
                },
            )

        buckets[user_id].append(now)

    return dependency
