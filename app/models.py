from datetime import UTC, datetime
from enum import Enum
import hashlib
import json
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Enum as SqlEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class CaseStatus(str, Enum):
    SUBMITTED = "submitted"
    ROUTED = "routed"
    UNDER_PROCESS = "under_process"
    DISPOSED = "disposed"
    APPEALED = "appealed"


class CitizenConfirmation(str, Enum):
    NOT_ASKED = "not_asked"
    YES = "yes"
    PARTIAL = "partial"
    NO = "no"
    WRONG_DEPT = "wrong_dept"


class GrievanceCategory(str, Enum):
    PM_KISAN_PAYMENT_FAILURE = "pm_kisan_payment_failure"
    EPFO_CLAIM_REJECTED = "epfo_claim_rejected"
    INCOME_TAX_REFUND_DELAYED = "income_tax_refund_delayed"
    SCHOLARSHIP_NSP_PAYMENT_STUCK = "scholarship_nsp_payment_stuck"
    NREGA_WAGE_DELAYED = "nrega_wage_delayed"


STATUS_MESSAGES: dict[CaseStatus, str] = {
    CaseStatus.SUBMITTED: "Your complaint has been submitted successfully.",
    CaseStatus.ROUTED: "Your complaint has been routed, but action may not have started.",
    CaseStatus.UNDER_PROCESS: "The department has not completed a final action yet.",
    CaseStatus.DISPOSED: (
        "The department has closed the complaint; this does not necessarily mean "
        "payment or service was received."
    ),
    CaseStatus.APPEALED: (
        "An appeal has been created because the reported issue remains unresolved."
    ),
}

# SLA deadlines (in days) per status transition — used for breach detection
SLA_DEADLINES: dict[CaseStatus, int] = {
    CaseStatus.SUBMITTED: 7,     # Must be routed within 7 days
    CaseStatus.ROUTED: 15,       # Must begin processing within 15 days
    CaseStatus.UNDER_PROCESS: 30,  # Must be disposed within 30 days
}


def enum_values(enum_class: type[Enum]) -> list[str]:
    return [str(member.value) for member in enum_class]


def compute_event_hash(previous_hash: str, event: dict[str, Any]) -> str:
    """Compute SHA-256 hash for a timeline event, chained to previous hash.

    This creates a tamper-evident audit trail where modifying any earlier
    event invalidates all subsequent hashes.
    """
    canonical = json.dumps(event, sort_keys=True, separators=(",", ":"))
    payload = f"{previous_hash}|{canonical}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compute_chain_hash(timeline: list[dict[str, Any]]) -> str:
    """Walk the full timeline and return the running hash after all events."""
    running_hash = "0" * 64  # genesis hash
    for event in timeline:
        # Use the event without the hash field itself
        event_data = {k: v for k, v in event.items() if k != "hash"}
        running_hash = compute_event_hash(running_hash, event_data)
    return running_hash


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    complaint_text: Mapped[str] = mapped_column(Text)
    diagnostic_answers: Mapped[dict[str, bool]] = mapped_column(JSON)
    status: Mapped[CaseStatus] = mapped_column(
        SqlEnum(
            CaseStatus,
            native_enum=False,
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=CaseStatus.SUBMITTED,
        index=True,
    )
    status_plain_language: Mapped[str] = mapped_column(Text)
    routed_department: Mapped[str] = mapped_column(String(200))
    routing_reason: Mapped[str] = mapped_column(Text)
    evidence: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    timeline: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    citizen_confirmed: Mapped[CitizenConfirmation] = mapped_column(
        SqlEnum(
            CitizenConfirmation,
            native_enum=False,
            values_callable=enum_values,
            validate_strings=True,
        ),
        default=CitizenConfirmation.NOT_ASKED,
    )
    appeal_draft: Mapped[str | None] = mapped_column(Text, nullable=True)
    routing_correct: Mapped[bool] = mapped_column(Boolean, default=True)
    audit_hash: Mapped[str] = mapped_column(
        String(64), default="0" * 64,
        doc="SHA-256 hash chain head — tamper-evident audit integrity"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
