import os
import threading
import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        if max_requests < 1 or window_seconds < 1:
            raise ValueError("Rate-limit values must be positive")
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def __call__(self, request: Request) -> None:
        now = time.monotonic()
        client_host = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{client_host}"

        with self._lock:
            timestamps = self._requests[key]
            cutoff = now - self.window_seconds
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= self.max_requests:
                retry_after = max(1, int(timestamps[0] + self.window_seconds - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            timestamps.append(now)
            remaining = self.max_requests - len(timestamps)

        request.state.rate_limit_remaining = remaining


AUTH_RATE_LIMIT = RateLimiter(
    max_requests=int(os.getenv("AUTH_RATE_LIMIT_MAX_REQUESTS", "10")),
    window_seconds=int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", "60")),
)
