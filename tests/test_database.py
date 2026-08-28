from datetime import UTC, datetime

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend.models import Case, CaseStatus, CitizenConfirmation
from backend.schemas import CaseResponse


def make_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return Session(engine)


def test_case_table_is_created() -> None:
    session = make_session()
    try:
        assert "cases" in inspect(session.get_bind()).get_table_names()
    finally:
        session.close()


def test_case_stores_json_and_public_schema_hides_routing_correct() -> None:
    session = make_session()
    now = datetime(2026, 8, 24, 10, 30, tzinfo=UTC)
    case = Case(
        category="pm_kisan_payment_failure",
        complaint_text="Fictional PM-KISAN payment complaint.",
        diagnostic_answers={"eKycComplete": True},
        status=CaseStatus.SUBMITTED,
        status_plain_language="Your complaint has been submitted successfully.",
        routed_department="Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)",
        routing_reason="The PM-KISAN payment rule matched.",
        evidence=[
            {
                "type": "aadhaar",
                "description": "Aadhaar identity document",
                "present": True,
            }
        ],
        timeline=[
            {
                "stage": "submitted",
                "timestamp": now.isoformat().replace("+00:00", "Z"),
                "note": "Complaint submitted successfully.",
            }
        ],
        citizen_confirmed=CitizenConfirmation.NOT_ASKED,
        routing_correct=True,
    )
    session.add(case)
    session.commit()
    session.refresh(case)

    stored = session.get(Case, case.id)
    payload = CaseResponse.model_validate(stored).model_dump(
        mode="json", by_alias=True
    )

    assert payload["diagnosticAnswers"] == {"eKycComplete": True}
    assert payload["evidence"][0]["type"] == "aadhaar"
    assert payload["status"] == "submitted"
    assert "routingCorrect" not in payload
    assert "routing_correct" not in payload
    session.close()
