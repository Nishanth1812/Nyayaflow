import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Case, CaseStatus, CitizenConfirmation, GrievanceCategory
from app.seed import seed_database
from app.services.diagnostic_engine import diagnose_category


def test_seed_inserts_five_cases_only_once(db_session: Session) -> None:
    seed_database(db_session)
    seed_database(db_session)

    assert db_session.scalar(select(func.count(Case.id))) == 5


def test_seed_has_one_phase_two_case_at_each_distinct_failure_stage(
    db_session: Session,
) -> None:
    seed_database(db_session)
    cases = {
        case.category: case
        for case in db_session.scalars(select(Case)).all()
    }

    expected_failures = {
        GrievanceCategory.EPFO_CLAIM_REJECTED: "nameMatchesRecords",
        GrievanceCategory.INCOME_TAX_REFUND_DELAYED: "hasSection245Demand",
        GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK: "stateDistrictApproved",
    }
    assert expected_failures.keys() <= cases.keys()

    for category, failed_check in expected_failures.items():
        result = diagnose_category(category, cases[category].diagnostic_answers)
        assert result["failedCheck"] == failed_check


def test_seed_backfills_missing_domain_examples_without_duplicating_existing_cases(
    db_session: Session,
) -> None:
    existing = Case(
        category=GrievanceCategory.PM_KISAN_PAYMENT_FAILURE.value,
        complaint_text="Existing fictional PM-KISAN demo case.",
        diagnostic_answers={},
        status=CaseStatus.SUBMITTED,
        status_plain_language="Submitted.",
        routed_department="PM-KISAN Cell",
        routing_reason="Existing demo route.",
        evidence=[],
        timeline=[],
        citizen_confirmed=CitizenConfirmation.NOT_ASKED,
        routing_correct=True,
    )
    db_session.add(existing)
    db_session.commit()

    seed_database(db_session)
    seed_database(db_session)

    cases = list(db_session.scalars(select(Case)).all())
    assert len(cases) == 4
    assert {case.category for case in cases} == {
        "pm_kisan_payment_failure",
        "epfo_claim_rejected",
        "income_tax_refund_delayed",
        "scholarship_nsp_payment_stuck",
    }


def test_seed_unresolved_case_preserves_disposal_then_appeal(
    db_session: Session,
) -> None:
    seed_database(db_session)

    unresolved = db_session.scalar(
        select(Case).where(Case.citizen_confirmed == CitizenConfirmation.NO)
    )

    assert unresolved is not None
    assert unresolved.status == CaseStatus.APPEALED
    assert [event["stage"] for event in unresolved.timeline][-2:] == [
        "disposed",
        "appealed",
    ]
    assert unresolved.appeal_draft is not None
    assert "closed without the citizen receiving" in unresolved.appeal_draft


def test_seed_contains_no_sensitive_identifiers(db_session: Session) -> None:
    seed_database(db_session)
    cases = list(db_session.scalars(select(Case)).all())
    serialized = " ".join(
        f"{case.complaint_text} {case.evidence} {case.appeal_draft or ''}"
        for case in cases
    )

    assert "aadhaar number" not in serialized.lower()
    assert re.search(r"\b\d{9,16}\b", serialized) is None
