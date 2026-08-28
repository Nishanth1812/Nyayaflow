from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.models import (
    STATUS_MESSAGES,
    Case,
    CaseStatus,
    CitizenConfirmation,
)


def timestamp(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def add_metric_case(
    db: Session,
    confirmation: CitizenConfirmation,
    routing_correct: bool,
    response_minutes: int | None,
) -> None:
    submitted_at = datetime(2026, 8, 24, 10, 0, tzinfo=UTC)
    timeline = [
        {
            "stage": "submitted",
            "timestamp": timestamp(submitted_at),
            "note": "Complaint submitted successfully.",
        }
    ]
    if response_minutes is not None:
        timeline.append(
            {
                "stage": "routed",
                "timestamp": timestamp(submitted_at + timedelta(minutes=response_minutes)),
                "note": "Complaint routed to a department.",
            }
        )

    case = Case(
        category="fictional_demo",
        complaint_text="Fictional metric case.",
        diagnostic_answers={},
        status=CaseStatus.ROUTED if response_minutes is not None else CaseStatus.SUBMITTED,
        status_plain_language=STATUS_MESSAGES[
            CaseStatus.ROUTED if response_minutes is not None else CaseStatus.SUBMITTED
        ],
        routed_department="Fictional Department",
        routing_reason="Deterministic test fixture.",
        evidence=[],
        timeline=timeline,
        citizen_confirmed=confirmation,
        routing_correct=routing_correct,
    )
    db.add(case)
    db.commit()


def test_metrics_are_calculated_from_eligible_cases_only(
    client: TestClient, db_session: Session
) -> None:
    add_metric_case(db_session, CitizenConfirmation.YES, True, 10)
    add_metric_case(db_session, CitizenConfirmation.NO, True, 20)
    add_metric_case(db_session, CitizenConfirmation.NOT_ASKED, False, None)

    response = client.get("/metrics")

    assert response.status_code == 200
    assert response.json() == {
        "totalCases": 3,
        "correctlyRoutedPercentage": 66.67,
        "citizenConfirmedResolutionRate": 50.0,
        "averageTimeToFirstResponseMinutes": 15.0,
    }


def test_empty_metrics_use_safe_zero_values(client: TestClient) -> None:
    response = client.get("/metrics")

    assert response.status_code == 200
    assert response.json() == {
        "totalCases": 0,
        "correctlyRoutedPercentage": 0.0,
        "citizenConfirmedResolutionRate": 0.0,
        "averageTimeToFirstResponseMinutes": 0.0,
    }
