"""
Vercel serverless entrypoint for NyayaFlow FastAPI backend.

Vercel's Python runtime looks for an `app` variable in
`api/index.py` and treats it as an ASGI application. All backend routes
(`/health`, `/cases`, `/diagnose`, `/route`, etc.) are handled by the
single FastAPI instance defined in `backend.main`.

This file is intentionally tiny — it only re-exports the existing
application. Keep all business logic in `backend/`.
"""

from backend.main import app  # noqa: F401
