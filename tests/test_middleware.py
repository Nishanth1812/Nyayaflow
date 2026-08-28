from fastapi.testclient import TestClient

from backend.main import rate_limiter


def test_rate_limit_blocks_after_threshold(client: TestClient) -> None:
    rate_limiter.limit = 2
    rate_limiter.reset()
    headers = {"X-Forwarded-For": "203.0.113.9"}
    try:
        assert client.get("/health", headers=headers).status_code == 200
        assert client.get("/health", headers=headers).status_code == 200
        assert client.get("/health", headers=headers).status_code == 429
    finally:
        rate_limiter.limit = int(__import__("os").getenv("NYAYAFLOW_RATE_LIMIT_PER_MINUTE", "120"))
        rate_limiter.reset()


def test_rate_limit_allows_configured_origin(client: TestClient) -> None:
    response = client.options(
        "/diagnose",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
