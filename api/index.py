"""
Vercel serverless entrypoint for NyayaFlow FastAPI backend.

Vercel's Python runtime (python3.12) looks for an `app` variable in
`api/index.py` and treats it as an ASGI application. All backend routes
(`/health`, `/cases`, `/diagnose`, `/route`, etc.) are handled by the
single FastAPI instance defined in `backend.main`.

This file is intentionally tiny — it only re-exports the existing
application. Keep all business logic in `backend/`.
"""

from backend.main import app  # noqa: F401

# Optional Mangum compatibility for AWS Lambda-style invocation.
# Vercel handles ASGI natively, so this is not required for Vercel,
# but exposing `handler` makes the same code portable.
try:
    from mangum import Mangum  # type: ignore

    handler = Mangum(app, lifespan="off")
except ImportError:  # pragma: no cover - mangum is optional
    handler = app  # type: ignore[assignment]
