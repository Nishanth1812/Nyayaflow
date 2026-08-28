import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Load .env for local dev (Vercel injects env vars directly)
try:
    from dotenv import load_dotenv

    load_dotenv()  # loads H:/Personal/Hackathons/NyayaFlow/.env if present
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass


def _resolve_database_url() -> str:
    """Resolve DATABASE_URL with Vercel ephemeral filesystem handling.

    Vercel's filesystem is read-only except for /tmp. Using
    sqlite:///./nyayaflow.db would fail in production. In that
    environment we automatically switch to /tmp unless an explicit
    Postgres URL is provided via NYAYAFLOW_DATABASE_URL.
    """
    explicit = os.getenv("NYAYAFLOW_DATABASE_URL")
    if explicit:
        return explicit
    # Detect Vercel or any serverless environment with writable /tmp
    is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
    if is_vercel:
        return "sqlite:////tmp/nyayaflow.db"
    # Fallback check: if project root is read-only, use /tmp
    try:
        test_path = os.path.join(os.path.dirname(__file__), "..", "nyayaflow.db")
        # If /tmp exists and is writable, prefer it only on Vercel-like envs
        # Local dev keeps ./nyayaflow.db for persistence
        if is_vercel and os.path.isdir("/tmp") and os.access("/tmp", os.W_OK):
            return "sqlite:////tmp/nyayaflow.db"
    except Exception:
        pass
    return "sqlite:///./nyayaflow.db"


DATABASE_URL = _resolve_database_url()


class Base(DeclarativeBase):
    pass


connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
