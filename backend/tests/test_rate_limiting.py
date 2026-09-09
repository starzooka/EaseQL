import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.services.rate_limit import RateLimiter


def make_request(path: str, client_host: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": path,
            "raw_path": path.encode(),
            "scheme": "http",
            "query_string": b"",
            "headers": [],
            "client": (client_host, 1234),
            "server": ("testserver", 80),
        }
    )


def test_rate_limiter_rejects_requests_over_window_limit() -> None:
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    request = make_request("/api/auth/login", "198.51.100.10")

    limiter(request)
    limiter(request)

    with pytest.raises(HTTPException) as error:
        limiter(request)

    assert error.value.status_code == 429
    assert error.value.headers["Retry-After"].isdigit()
    assert error.value.headers["X-RateLimit-Limit"] == "2"
    assert error.value.headers["X-RateLimit-Remaining"] == "0"


def test_rate_limiter_tracks_paths_and_clients_separately() -> None:
    limiter = RateLimiter(max_requests=1, window_seconds=60)

    limiter(make_request("/api/auth/login", "198.51.100.10"))
    limiter(make_request("/api/auth/register", "198.51.100.10"))
    limiter(make_request("/api/auth/login", "198.51.100.11"))

    with pytest.raises(HTTPException):
        limiter(make_request("/api/auth/login", "198.51.100.10"))
