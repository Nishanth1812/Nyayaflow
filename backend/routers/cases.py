from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    STATUS_MESSAGES,
    Case,
    CaseStatus,
    CitizenConfirmation,
    compute_chain_hash,
)
from backend.schemas import (
    CaseCreate,
    CaseResponse,
    CaseStatusResponse,
    ConfirmationRequest,
    ConfirmationResponse,
)
from backend.services.appeal_generator import generate_appeal


router = APIRouter(prefix="/cases", tags=["cases"])

STATUS_TRANSITIONS: dict[CaseStatus, CaseStatus] = {
    CaseStatus.SUBMITTED: CaseStatus.ROUTED,
    CaseStatus.ROUTED: CaseStatus.UNDER_PROCESS,
    CaseStatus.UNDER_PROCESS: CaseStatus.DISPOSED,
}


def utc_timestamp() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def get_case_or_404(case_id: int, db: Session) -> Case:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {case_id} does not exist.",
        )
    return case


def transition_note(case: Case, next_status: CaseStatus) -> str:
    notes = {
        CaseStatus.ROUTED: f"Complaint routed to {case.routed_department}.",
        CaseStatus.UNDER_PROCESS: (
            f"Complaint is under process with {case.routed_department}."
        ),
        CaseStatus.DISPOSED: "Department marked the complaint as disposed.",
    }
    return notes[next_status]


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(request: CaseCreate, db: Session = Depends(get_db)) -> Case:
    initial_status = CaseStatus.SUBMITTED
    initial_timeline = [
        {
            "stage": initial_status.value,
            "timestamp": utc_timestamp(),
            "note": "Complaint submitted successfully.",
        }
    ]
    case = Case(
        category=request.category,
        complaint_text=request.complaint_text,
        diagnostic_answers=request.diagnostic_answers,
        status=initial_status,
        status_plain_language=STATUS_MESSAGES[initial_status],
        routed_department=request.routed_department,
        routing_reason=request.routing_reason,
        evidence=[item.model_dump(by_alias=True) for item in request.evidence],
        timeline=initial_timeline,
        citizen_confirmed=CitizenConfirmation.NOT_ASKED,
        appeal_draft=None,
        routing_correct=True,
        audit_hash=compute_chain_hash(initial_timeline),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("", response_model=list[CaseResponse])
def list_cases(db: Session = Depends(get_db)) -> list[Case]:
    return list(db.scalars(select(Case).order_by(Case.id)).all())


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)) -> Case:
    return get_case_or_404(case_id, db)


@router.post("/{case_id}/advance-status", response_model=CaseResponse)
def advance_status(case_id: int, db: Session = Depends(get_db)) -> Case:
    case = get_case_or_404(case_id, db)
    next_status = STATUS_TRANSITIONS.get(case.status)
    if next_status is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A case with status '{case.status.value}' cannot be advanced.",
        )

    note = transition_note(case, next_status)
    new_event = {"stage": next_status.value, "timestamp": utc_timestamp(), "note": note}
    case.status = next_status
    case.status_plain_language = STATUS_MESSAGES[next_status]
    case.timeline = [*case.timeline, new_event]
    case.audit_hash = compute_chain_hash(case.timeline)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}/status", response_model=CaseStatusResponse)
def case_status(case_id: int, db: Session = Depends(get_db)) -> CaseStatusResponse:
    case = get_case_or_404(case_id, db)
    return CaseStatusResponse(
        status=case.status, status_plain_language=case.status_plain_language
    )


@router.post("/{case_id}/confirm-resolution", response_model=ConfirmationResponse)
def confirm_resolution(
    case_id: int,
    request: ConfirmationRequest,
    db: Session = Depends(get_db),
) -> ConfirmationResponse:
    case = get_case_or_404(case_id, db)
    confirmation = CitizenConfirmation(request.citizen_confirmed.value)
    case.citizen_confirmed = confirmation
    appeal_generated = confirmation in {
        CitizenConfirmation.NO,
        CitizenConfirmation.WRONG_DEPT,
    }

    explanations = {
        CitizenConfirmation.YES: "The citizen confirmed that the issue is resolved.",
        CitizenConfirmation.PARTIAL: (
            "The citizen reported a partial resolution. Further action may be necessary."
        ),
        CitizenConfirmation.NO: (
            "An appeal was generated because the citizen reported no resolution."
        ),
        CitizenConfirmation.WRONG_DEPT: (
            "An appeal was generated because the citizen reported incorrect routing."
        ),
    }

    if appeal_generated:
        case.appeal_draft = generate_appeal(case, confirmation)
        case.status = CaseStatus.APPEALED
        case.status_plain_language = STATUS_MESSAGES[CaseStatus.APPEALED]
        if not case.timeline or case.timeline[-1]["stage"] != CaseStatus.APPEALED.value:
            appeal_event = {
                "stage": CaseStatus.APPEALED.value,
                "timestamp": utc_timestamp(),
                "note": (
                    "Appeal created because the citizen reported that the grievance "
                    "remains unresolved."
                ),
            }
            case.timeline = [*case.timeline, appeal_event]
            case.audit_hash = compute_chain_hash(case.timeline)
    elif confirmation == CitizenConfirmation.YES:
        case.status_plain_language = "Grievance resolved and verified by citizen. Case officially closed."
        if not case.timeline or case.timeline[-1].get("stage") != "RESOLVED":
            resolved_event = {
                "stage": "RESOLVED",
                "timestamp": utc_timestamp(),
                "note": (
                    "Citizen verified receipt of benefit/payment. Grievance officially closed."
                ),
            }
            case.timeline = [*case.timeline, resolved_event]
            case.audit_hash = compute_chain_hash(case.timeline)

    db.commit()
    db.refresh(case)
    return ConfirmationResponse(
        case_id=case.id,
        citizen_confirmed=case.citizen_confirmed,
        appeal_generated=appeal_generated,
        appeal_draft=case.appeal_draft,
        explanation=explanations[confirmation],
        case=CaseResponse.model_validate(case),
    )
