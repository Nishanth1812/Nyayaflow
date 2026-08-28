import asyncio
import logging
import os
import time
import uuid
from collections import defaultdict, deque
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Load .env for local dev (Vercel injects env vars directly)
try:
    from dotenv import load_dotenv

    load_dotenv()
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

from app import models  # noqa: F401 -- registers SQLAlchemy tables
from app.database import Base, SessionLocal, engine
from app.routers import cases, diagnose, evidence, metrics, routing, rules
from app.schemas import HealthResponse
from app.seed import seed_database


logging.basicConfig(
    level=os.getenv("NYAYAFLOW_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("nyayaflow")


def _parse_cors_origins() -> list[str]:
    raw = os.getenv(
        "NYAYAFLOW_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    )
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    # Auto-allow Vercel deployment URL (e.g. nyayaflow.vercel.app) for
    # same-project frontend + preview deployments.
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        for scheme in ("https://", "http://"):
            url = f"{scheme}{vercel_url}"
            if url not in origins:
                origins.append(url)
    # Allow explicit frontend URL if provided (e.g. custom domain)
    frontend_url = os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_VERCEL_URL")
    if frontend_url:
        frontend_url = frontend_url.strip()
        if frontend_url and frontend_url not in origins:
            origins.append(frontend_url if "://" in frontend_url else f"https://{frontend_url}")
    return origins


def _parse_cors_origin_regex() -> str | None:
    # Allow all Vercel preview deployments (*.vercel.app) when running on Vercel.
    explicit = os.getenv("NYAYAFLOW_CORS_ORIGIN_REGEX")
    if explicit:
        return explicit if explicit.lower() != "none" else None
    if os.getenv("VERCEL") == "1":
        return r"https://.*\.vercel\.app"
    return None


ALLOWED_ORIGINS = _parse_cors_origins()
ALLOWED_ORIGIN_REGEX = _parse_cors_origin_regex()
RATE_LIMIT_PER_MINUTE = int(os.getenv("NYAYAFLOW_RATE_LIMIT_PER_MINUTE", "120"))
RATE_WINDOW_SECONDS = 60.0
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


class RateLimiter:
    """Best-effort in-memory sliding-window limiter (per-process).

    Production deployments behind multiple workers should use a shared
    store (e.g. Redis). This keeps the demo dependency-free.
    """

    def __init__(self, limit: int, window: float) -> None:
        self.limit = limit
        self.window = window
        self.hits: dict[str, deque] = defaultdict(deque)

    def is_allowed(self, client_ip: str, now: float) -> bool:
        bucket = self.hits[client_ip]
        while bucket and bucket[0] < now - self.window:
            bucket.popleft()
        if len(bucket) >= self.limit:
            return False
        bucket.append(now)
        return True

    def reset(self) -> None:
        self.hits.clear()


rate_limiter = RateLimiter(RATE_LIMIT_PER_MINUTE, RATE_WINDOW_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        try:
            conn.exec_driver_sql(
                "ALTER TABLE cases ADD COLUMN audit_hash VARCHAR(64) DEFAULT ''"
            )
        except Exception:
            pass
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="NyayaFlow-engine",
    description=(
        "Deterministic and explainable grievance diagnostics, routing, and case tracking."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def rate_limit_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client is not None:
        client_ip = request.client.host
    else:
        client_ip = "unknown"
    if not rate_limiter.is_allowed(client_ip, time.time()):
        logger.warning("Rate limit exceeded for %s", client_ip)
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down and try again shortly."},
            headers={"Retry-After": "60"},
        )
    return await call_next(request)


@app.middleware("http")
async def add_security_headers(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="NyayaFlow-engine")


if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/", include_in_schema=False)
    def index() -> Response:
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return HealthResponse(status="ok", service="NyayaFlow-engine")


app.include_router(diagnose.router)
app.include_router(routing.router)
app.include_router(rules.router)
app.include_router(evidence.router)
app.include_router(cases.router)
app.include_router(metrics.router)

