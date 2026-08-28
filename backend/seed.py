from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import (
    STATUS_MESSAGES,
    Case,
    CaseStatus,
    CitizenConfirmation,
    GrievanceCategory,
    compute_chain_hash,
)
from backend.services.appeal_generator import generate_appeal
from backend.services.diagnostic_engine import (
    EPFO_DEPARTMENT,
    INCOME_TAX_DEPARTMENT,
    NSP_DEPARTMENT,
    PM_KISAN_DEPARTMENT,
)


def timestamp(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def event(stage: CaseStatus, at: datetime, note: str) -> dict[str, Any]:
    return {"stage": stage.value, "timestamp": timestamp(at), "note": note}


def seed_database(db: Session) -> None:
    """Ensure every demo domain has an example without duplicating seeded domains."""
    existing_cases = list(db.scalars(select(Case)).all())
    for c in existing_cases:
        if not c.audit_hash or c.audit_hash == "0" * 64:
            c.audit_hash = compute_chain_hash(c.timeline)
    if existing_cases:
        db.commit()

    existing_categories = {c.category for c in existing_cases}
    required_categories = {category.value for category in GrievanceCategory}
    if required_categories <= existing_categories:
        return
    database_is_empty = not existing_categories

    base = datetime(2026, 8, 24, 8, 0, tzinfo=UTC)
    passed_diagnostics = {
        "eKycComplete": True,
        "bankAadhaarSeeded": True,
        "npciMappingActive": True,
        "landRecordNameMatch": True,
    }
    pm_evidence = [
        {
            "type": "aadhaar",
            "description": "Aadhaar identity document available for verification",
            "present": True,
        },
        {
            "type": "pmKisanRegistrationNumber",
            "description": "Fictional PM-KISAN registration reference is available",
            "present": True,
        },
        {
            "type": "bankAccountProof",
            "description": "Bank account proof is available without account details",
            "present": True,
        },
        {
            "type": "paymentStatusScreenshot",
            "description": "Payment status screenshot is available",
            "present": True,
        },
    ]

    # Case 1: PM-KISAN (Under Process)
    case_one_start = base + timedelta(hours=1)
    case_one_timeline = [
        event(
            CaseStatus.SUBMITTED,
            case_one_start,
            "Complaint registered via CPGRAMS NyayaFlow assisted intake.",
        ),
        event(
            CaseStatus.ROUTED,
            case_one_start + timedelta(minutes=5),
            f"Complaint routed to {PM_KISAN_DEPARTMENT}.",
        ),
        event(
            CaseStatus.UNDER_PROCESS,
            case_one_start + timedelta(minutes=20),
            f"State Agriculture Nodal Officer initiated PFMS bank mandate re-validation with {PM_KISAN_DEPARTMENT}.",
        ),
    ]
    case_one = Case(
        category="pm_kisan_payment_failure",
        complaint_text="16th instalment of Rs. 2,000 for FY 2025-26 not received. Aadhaar e-KYC and land seeding verified.",
        diagnostic_answers=passed_diagnostics,
        status=CaseStatus.UNDER_PROCESS,
        status_plain_language=STATUS_MESSAGES[CaseStatus.UNDER_PROCESS],
        routed_department=PM_KISAN_DEPARTMENT,
        routing_reason=(
            "The issue mentions PM-KISAN and instalment, matching the PM-KISAN "
            "payment routing rule."
        ),
        evidence=pm_evidence,
        timeline=case_one_timeline,
        citizen_confirmed=CitizenConfirmation.NOT_ASKED,
        routing_correct=True,
        audit_hash=compute_chain_hash(case_one_timeline),
        created_at=case_one_start,
        updated_at=case_one_start + timedelta(minutes=20),
    )

    # Case 2: PM-KISAN (Disposed -> Appealed)
    case_two_start = base
    disposed_at = case_two_start + timedelta(hours=4)
    appealed_at = disposed_at + timedelta(minutes=15)
    case_two_timeline = [
        event(
            CaseStatus.SUBMITTED,
            case_two_start,
            "Complaint filed for missing PM-KISAN payment.",
        ),
        event(
            CaseStatus.ROUTED,
            case_two_start + timedelta(minutes=6),
            f"Complaint routed to {PM_KISAN_DEPARTMENT}.",
        ),
        event(
            CaseStatus.UNDER_PROCESS,
            case_two_start + timedelta(minutes=40),
            f"FTO response code under review with {PM_KISAN_DEPARTMENT}.",
        ),
        event(
            CaseStatus.DISPOSED,
            disposed_at,
            "Department marked the complaint as disposed without bank credit.",
        ),
    ]
    case_two = Case(
        category="pm_kisan_payment_failure",
        complaint_text=(
            "My fictional PM-KISAN payment was not credited even though the portal "
            "shows the grievance as closed without the citizen receiving funds."
        ),
        diagnostic_answers=passed_diagnostics,
        status=CaseStatus.DISPOSED,
        status_plain_language=STATUS_MESSAGES[CaseStatus.DISPOSED],
        routed_department=PM_KISAN_DEPARTMENT,
        routing_reason=(
            "The issue mentions PM-KISAN and payment, matching the PM-KISAN payment "
            "routing rule."
        ),
        evidence=pm_evidence,
        timeline=case_two_timeline,
        citizen_confirmed=CitizenConfirmation.NO,
        routing_correct=True,
        audit_hash=compute_chain_hash(case_two_timeline),
        created_at=case_two_start,
        updated_at=disposed_at,
    )

    # Case 3: EPFO (Disposed - Resolved)
    case_three_start = base + timedelta(hours=2)
    case_three_timeline = [
        event(
            CaseStatus.SUBMITTED,
            case_three_start,
            "Complaint submitted with UAN profile and rejection slip.",
        ),
        event(
            CaseStatus.ROUTED,
            case_three_start + timedelta(minutes=12),
            f"Complaint routed to {EPFO_DEPARTMENT}.",
        ),
        event(
            CaseStatus.UNDER_PROCESS,
            case_three_start + timedelta(minutes=35),
            "EPFO began processing the name synchronization request.",
        ),
        event(
            CaseStatus.DISPOSED,
            case_three_start + timedelta(hours=3),
            "Department resolved and marked the complaint as disposed; claim credited.",
        ),
    ]
    case_three = Case(
        category=GrievanceCategory.EPFO_CLAIM_REJECTED.value,
        complaint_text="Form 19 PF Final Settlement rejected due to father's name spelling discrepancy between UAN record and Aadhaar.",
        diagnostic_answers={
            "nameMatchesRecords": False,
            "dateOfBirthMatches": True,
            "bankAccountLinkedToUan": True,
            "employerUpdatedDateOfExit": True,
        },
        status=CaseStatus.DISPOSED,
        status_plain_language=STATUS_MESSAGES[CaseStatus.DISPOSED],
        routed_department=EPFO_DEPARTMENT,
        routing_reason="The issue mentions UAN, matching the EPFO routing rule.",
        evidence=[],
        timeline=case_three_timeline,
        citizen_confirmed=CitizenConfirmation.YES,
        routing_correct=True,
        audit_hash=compute_chain_hash(case_three_timeline),
        created_at=case_three_start,
        updated_at=case_three_start + timedelta(hours=3),
    )

    # Case 4: Income Tax (Disposed - Partial)
    case_four_start = base + timedelta(hours=3)
    case_four_timeline = [
        event(
            CaseStatus.SUBMITTED,
            case_four_start,
            "Complaint submitted with ITR filing acknowledgment.",
        ),
        event(
            CaseStatus.ROUTED,
            case_four_start + timedelta(minutes=15),
            f"Complaint routed to {INCOME_TAX_DEPARTMENT}.",
        ),
        event(
            CaseStatus.UNDER_PROCESS,
            case_four_start + timedelta(minutes=50),
            f"{INCOME_TAX_DEPARTMENT} verified rectification order u/s 154.",
        ),
        event(
            CaseStatus.DISPOSED,
            case_four_start + timedelta(hours=5),
            "Department marked the complaint as disposed with partial demand adjustment.",
        ),
    ]
    case_four = Case(
        category=GrievanceCategory.INCOME_TAX_REFUND_DELAYED.value,
        complaint_text="AY 2025-26 refund of Rs. 14,850 delayed and adjusted under Section 245 against a disputed demand.",
        diagnostic_answers={
            "itrMatchesAis26as": True,
            "hasSection245Demand": True,
            "itrVerified": True,
        },
        status=CaseStatus.DISPOSED,
        status_plain_language=STATUS_MESSAGES[CaseStatus.DISPOSED],
        routed_department=INCOME_TAX_DEPARTMENT,
        routing_reason="The issue mentions ITR and refund, matching the income-tax rule.",
        evidence=[],
        timeline=case_four_timeline,
        citizen_confirmed=CitizenConfirmation.PARTIAL,
        routing_correct=False,
        audit_hash=compute_chain_hash(case_four_timeline),
        created_at=case_four_start,
        updated_at=case_four_start + timedelta(hours=5),
    )

    # Case 5: NSP Scholarship (Routed)
    case_five_start = base + timedelta(hours=4)
    case_five_timeline = [
        event(
            CaseStatus.SUBMITTED,
            case_five_start,
            "Complaint submitted with NSP Application ID and Bonafide Certificate.",
        ),
        event(
            CaseStatus.ROUTED,
            case_five_start + timedelta(minutes=10),
            f"Complaint routed to {NSP_DEPARTMENT}.",
        ),
    ]
    case_five = Case(
        category=GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK.value,
        complaint_text=(
            "Post-Matric Scholarship of Rs. 18,000 for OBC category approved by Institute Nodal Officer, pending District Welfare Officer level-2 sign-off."
        ),
        diagnostic_answers={
            "eKycAadhaarSeeded": True,
            "instituteVerified": True,
            "stateDistrictApproved": False,
        },
        status=CaseStatus.ROUTED,
        status_plain_language=STATUS_MESSAGES[CaseStatus.ROUTED],
        routed_department=NSP_DEPARTMENT,
        routing_reason=(
            "The issue mentions NSP and scholarship, matching the scholarship rule."
        ),
        evidence=[],
        timeline=case_five_timeline,
        citizen_confirmed=CitizenConfirmation.NOT_ASKED,
        routing_correct=True,
        audit_hash=compute_chain_hash(case_five_timeline),
        created_at=case_five_start,
        updated_at=case_five_start + timedelta(minutes=10),
    )

    cases_to_add: list[Case] = []
    if database_is_empty:
        cases_to_add.extend([case_one, case_two])
    elif GrievanceCategory.PM_KISAN_PAYMENT_FAILURE.value not in existing_categories:
        cases_to_add.append(case_one)

    category_cases = (
        (GrievanceCategory.EPFO_CLAIM_REJECTED, case_three),
        (GrievanceCategory.INCOME_TAX_REFUND_DELAYED, case_four),
        (GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK, case_five),
    )
    cases_to_add.extend(
        case for category, case in category_cases if category.value not in existing_categories
    )

    db.add_all(cases_to_add)
    db.flush()
    if database_is_empty:
        case_two.appeal_draft = generate_appeal(case_two, CitizenConfirmation.NO)
        case_two.status = CaseStatus.APPEALED
        case_two.status_plain_language = STATUS_MESSAGES[CaseStatus.APPEALED]
        case_two.timeline = [
            *case_two.timeline,
            event(
                CaseStatus.APPEALED,
                appealed_at,
                "Appeal created because the citizen reported that the grievance was closed without the citizen receiving funds.",
            ),
        ]
        case_two.audit_hash = compute_chain_hash(case_two.timeline)
    db.commit()
