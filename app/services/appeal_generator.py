from datetime import UTC, datetime

from app.models import Case, CitizenConfirmation


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def _format_date(value: str) -> str:
    return _parse_timestamp(value).strftime("%d %B %Y at %H:%M UTC")


def generate_appeal(case: Case, confirmation: CitizenConfirmation) -> str:
    """Generate an explainable appeal from persisted case facts only."""
    if confirmation == CitizenConfirmation.NO:
        missing_remedy = (
            "The grievance was closed without the citizen receiving the requested "
            "payment or service."
        )
    elif confirmation == CitizenConfirmation.WRONG_DEPT:
        missing_remedy = (
            "The grievance appears to have been routed to the incorrect department, "
            "so the requested remedy was not provided."
        )
    else:
        raise ValueError("Appeals are generated only for 'no' or 'wrong_dept'.")

    timeline_lines = "\n".join(
        f"- {event['stage'].replace('_', ' ').title()}: "
        f"{_format_date(event['timestamp'])} — {event['note']}"
        for event in case.timeline
    )

    return (
        f"Subject: Request for Review of Grievance Case #{case.id}\n\n"
        f"I am requesting a review of grievance case #{case.id}.\n\n"
        f"Original complaint:\n\"{case.complaint_text}\"\n\n"
        f"The complaint was routed to:\n{case.routed_department}\n\n"
        f"Relevant case timeline:\n{timeline_lines}\n\n"
        f"Current administrative status: {case.status.value}.\n"
        f"Citizen confirmation: {confirmation.value}.\n\n"
        f"Missing remedy:\n{missing_remedy}\n\n"
        "I therefore request that the grievance be reopened or escalated and that "
        "the pending remedy be provided."
    )
