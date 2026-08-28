from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, CitizenConfirmation
from app.schemas import MetricsResponse


router = APIRouter(tags=["metrics"])


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def first_response_minutes(case: Case) -> float | None:
    submitted_index = next(
        (
            index
            for index, event in enumerate(case.timeline)
            if event["stage"] == "submitted"
        ),
        None,
    )
    if submitted_index is None or submitted_index + 1 >= len(case.timeline):
        return None

    submitted_at = parse_timestamp(case.timeline[submitted_index]["timestamp"])
    response_at = parse_timestamp(case.timeline[submitted_index + 1]["timestamp"])
    return (response_at - submitted_at).total_seconds() / 60


def percentage(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


@router.get("/metrics", response_model=MetricsResponse)
def metrics(db: Session = Depends(get_db)) -> MetricsResponse:
    cases = list(db.scalars(select(Case).order_by(Case.id)).all())
    total_cases = len(cases)
    correctly_routed = sum(case.routing_correct for case in cases)
    answered_cases = [
        case
        for case in cases
        if case.citizen_confirmed != CitizenConfirmation.NOT_ASKED
    ]
    confirmed_resolved = sum(
        case.citizen_confirmed == CitizenConfirmation.YES for case in answered_cases
    )
    response_times = [
        response_time
        for case in cases
        if (response_time := first_response_minutes(case)) is not None
    ]
    average_response = (
        round(sum(response_times) / len(response_times), 2) if response_times else 0.0
    )

    return MetricsResponse(
        total_cases=total_cases,
        correctly_routed_percentage=percentage(correctly_routed, total_cases),
        citizen_confirmed_resolution_rate=percentage(
            confirmed_resolved, len(answered_cases)
        ),
        average_time_to_first_response_minutes=average_response,
    )
