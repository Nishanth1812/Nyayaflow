import pytest

from app.models import GrievanceCategory
from app.services.diagnostic_engine import (
    DIAGNOSTIC_RULES,
    diagnose_answers,
    diagnose_category,
)
from app.services.evidence_checker import check_evidence
from app.services.routing_engine import route_issue


def valid_diagnostic_answers() -> dict[str, bool]:
    return {
        "eKycComplete": True,
        "bankAadhaarSeeded": True,
        "npciMappingActive": True,
        "landRecordNameMatch": True,
    }


def test_ekyc_failure_stops_diagnostic_evaluation_immediately() -> None:
    answers = valid_diagnostic_answers()
    answers.update(
        {
            "eKycComplete": False,
            "bankAadhaarSeeded": False,
            "npciMappingActive": False,
            "landRecordNameMatch": False,
        }
    )

    result = diagnose_answers(answers)

    assert result["outcome"] == "ekyc_incomplete"
    assert result["failedCheck"] == "eKycComplete"
    assert "eKYC" in result["reason"]


def test_bank_aadhaar_failure_returns_bank_seeding_result() -> None:
    answers = valid_diagnostic_answers()
    answers["bankAadhaarSeeded"] = False
    answers["npciMappingActive"] = False

    result = diagnose_answers(answers)

    assert result["outcome"] == "bank_aadhaar_not_seeded"
    assert result["failedCheck"] == "bankAadhaarSeeded"
    assert "Contact your bank" in result["actionableFix"]


def test_all_diagnostic_checks_pass_returns_ready_to_file() -> None:
    result = diagnose_answers(valid_diagnostic_answers())

    assert result == {
        "outcome": "ready_to_file",
        "failedCheck": None,
        "reason": "All prerequisite checks passed.",
        "actionableFix": "The issue can now be filed as a PM-KISAN payment grievance.",
        "recommendedDepartment": (
            "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)"
        ),
    }


@pytest.mark.parametrize(
    ("category", "answers", "failed_check", "expected_fix"),
    [
        (
            GrievanceCategory.EPFO_CLAIM_REJECTED,
            {
                "nameMatchesRecords": False,
                "dateOfBirthMatches": True,
                "bankAccountLinkedToUan": True,
                "employerUpdatedDateOfExit": True,
            },
            "nameMatchesRecords",
            "Joint Declaration",
        ),
        (
            GrievanceCategory.EPFO_CLAIM_REJECTED,
            {
                "nameMatchesRecords": True,
                "dateOfBirthMatches": False,
                "bankAccountLinkedToUan": True,
                "employerUpdatedDateOfExit": True,
            },
            "dateOfBirthMatches",
            "DOB correction",
        ),
        (
            GrievanceCategory.EPFO_CLAIM_REJECTED,
            {
                "nameMatchesRecords": True,
                "dateOfBirthMatches": True,
                "bankAccountLinkedToUan": False,
                "employerUpdatedDateOfExit": True,
            },
            "bankAccountLinkedToUan",
            "Manage > KYC",
        ),
        (
            GrievanceCategory.EPFO_CLAIM_REJECTED,
            {
                "nameMatchesRecords": True,
                "dateOfBirthMatches": True,
                "bankAccountLinkedToUan": True,
                "employerUpdatedDateOfExit": False,
            },
            "employerUpdatedDateOfExit",
            "Ask the employer",
        ),
        (
            GrievanceCategory.INCOME_TAX_REFUND_DELAYED,
            {
                "itrMatchesAis26as": False,
                "hasSection245Demand": False,
                "itrVerified": True,
            },
            "itrMatchesAis26as",
            "revised return",
        ),
        (
            GrievanceCategory.INCOME_TAX_REFUND_DELAYED,
            {
                "itrMatchesAis26as": True,
                "hasSection245Demand": True,
                "itrVerified": True,
            },
            "hasSection245Demand",
            "Section 245",
        ),
        (
            GrievanceCategory.INCOME_TAX_REFUND_DELAYED,
            {
                "itrMatchesAis26as": True,
                "hasSection245Demand": False,
                "itrVerified": False,
            },
            "itrVerified",
            "e-Verify Return",
        ),
        (
            GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK,
            {
                "eKycAadhaarSeeded": False,
                "instituteVerified": True,
                "stateDistrictApproved": True,
            },
            "eKycAadhaarSeeded",
            "Aadhaar authentication",
        ),
        (
            GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK,
            {
                "eKycAadhaarSeeded": True,
                "instituteVerified": False,
                "stateDistrictApproved": False,
            },
            "instituteVerified",
            "institute nodal officer",
        ),
        (
            GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK,
            {
                "eKycAadhaarSeeded": True,
                "instituteVerified": True,
                "stateDistrictApproved": False,
            },
            "stateDistrictApproved",
            "state or district nodal officer",
        ),
    ],
)
def test_category_diagnostics_stop_at_the_first_blocking_answer(
    category: GrievanceCategory,
    answers: dict[str, bool],
    failed_check: str,
    expected_fix: str,
) -> None:
    result = diagnose_category(category, answers)

    assert result["outcome"] == "prerequisite_not_met"
    assert result["failedCheck"] == failed_check
    assert expected_fix in result["actionableFix"]


@pytest.mark.parametrize(
    ("category", "answers", "department"),
    [
        (
            GrievanceCategory.EPFO_CLAIM_REJECTED,
            {
                "nameMatchesRecords": True,
                "dateOfBirthMatches": True,
                "bankAccountLinkedToUan": True,
                "employerUpdatedDateOfExit": True,
            },
            "EPFO Regional PF Commissioner Office",
        ),
        (
            GrievanceCategory.INCOME_TAX_REFUND_DELAYED,
            {
                "itrMatchesAis26as": True,
                "hasSection245Demand": False,
                "itrVerified": True,
            },
            "CPC-ITR / Income Tax Grievance Cell",
        ),
        (
            GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK,
            {
                "eKycAadhaarSeeded": True,
                "instituteVerified": True,
                "stateDistrictApproved": True,
            },
            "National Scholarship Portal Grievance Cell",
        ),
    ],
)
def test_clear_category_diagnostics_are_ready_for_the_configured_department(
    category: GrievanceCategory,
    answers: dict[str, bool],
    department: str,
) -> None:
    result = diagnose_category(category, answers)

    assert result["outcome"] == "ready_to_file"
    assert result["recommendedDepartment"] == department


def test_income_tax_ready_result_explains_section_244a_interest_calculation() -> None:
    result = diagnose_category(
        GrievanceCategory.INCOME_TAX_REFUND_DELAYED,
        {
            "itrMatchesAis26as": True,
            "hasSection245Demand": False,
            "itrVerified": True,
        },
    )

    assert "0.5%" in result["actionableFix"]
    assert "refund amount × 0.005 × eligible months" in result["actionableFix"]
    assert "beyond the department's control" in result["actionableFix"]


def test_phase_two_rule_questions_match_the_public_intake_copy() -> None:
    expected_questions = {
        GrievanceCategory.EPFO_CLAIM_REJECTED: [
            "Does your name match exactly across Aadhaar, PAN, and EPFO UAN records?",
            "Is your date of birth consistent across Aadhaar and EPFO records?",
            "Is your bank account linked and verified with your UAN?",
            "Did your employer update your date of exit in the EPFO system?",
        ],
        GrievanceCategory.INCOME_TAX_REFUND_DELAYED: [
            "Does your ITR match your AIS/Form 26AS exactly (income, TDS entries)?",
            "Do you have any past disputed tax demand under Section 245?",
            "Has your ITR been verified (e-verified within 30 days of filing)?",
        ],
        GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK: [
            "Is your e-KYC / Aadhaar seeding complete on the NSP portal?",
            "Has your institute verified your application?",
            "Has your state/district nodal officer approved it after institute verification?",
        ],
    }

    assert {
        category: [rule["question"] for rule in DIAGNOSTIC_RULES[category]]
        for category in expected_questions
    } == expected_questions


def test_legacy_pm_kisan_land_record_fix_text_is_preserved() -> None:
    answers = valid_diagnostic_answers()
    answers["landRecordNameMatch"] = False

    result = diagnose_answers(answers)

    assert result["actionableFix"] == (
        "Verify that your name in the PM-KISAN registration matches the relevant "
        "land records and request correction through the appropriate state "
        "agriculture or land-record authority."
    )


def test_uan_routes_to_epfo_with_explanation() -> None:
    result = route_issue("general", "My UAN is not allowing PF withdrawal")

    assert result["department"] == "EPFO Regional PF Commissioner Office"
    assert result["matchedRule"] == "epfo"
    assert "UAN" in result["reason"]


@pytest.mark.parametrize(
    ("category", "description", "department", "matched_rule"),
    [
        (
            "epfo_claim_rejected",
            "My provident fund claim was rejected.",
            "EPFO Regional PF Commissioner Office",
            "epfo",
        ),
        (
            "income_tax_refund_delayed",
            "My 26AS is correct but the payment is pending.",
            "CPC-ITR / Income Tax Grievance Cell",
            "income_tax",
        ),
        (
            "scholarship_nsp_payment_stuck",
            "My stipend has not arrived.",
            "National Scholarship Portal Grievance Cell",
            "scholarship_nsp",
        ),
    ],
)
def test_phase_two_keywords_route_to_the_domain_department(
    category: str, description: str, department: str, matched_rule: str
) -> None:
    result = route_issue(category, description)

    assert result["department"] == department
    assert result["matchedRule"] == matched_rule


def test_pm_kisan_payment_text_routes_to_pm_kisan_cell() -> None:
    result = route_issue(
        "pm_kisan_payment_failure",
        "My PM-KISAN instalment has not reached my account.",
    )

    assert result["department"] == (
        "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)"
    )
    assert result["matchedRule"] == "pm_kisan_payment"
    assert "PM-KISAN" in result["reason"]
    assert "instalment" in result["reason"]


def test_unknown_text_falls_back_to_general_cpgrams() -> None:
    result = route_issue("other", "I need help with an unrelated service issue")

    assert result == {
        "department": "General CPGRAMS — needs manual categorization",
        "reason": (
            "No configured routing rule matched the category or issue description; "
            "manual categorization is required."
        ),
        "matchedRule": "fallback",
    }


def test_short_routing_keywords_do_not_match_inside_unrelated_words() -> None:
    result = route_issue(
        "other", "A helpful officer discussed an unrelated public service."
    )

    assert result["matchedRule"] == "fallback"


def test_evidence_completeness_is_calculated_from_required_fields() -> None:
    result = check_evidence(
        "pm_kisan_payment_failure",
        {
            "aadhaar": True,
            "pmKisanRegistrationNumber": True,
            "bankAccountProof": False,
            "paymentStatusScreenshot": False,
            "unrelatedDocument": True,
        },
    )

    assert result == {
        "category": "pm_kisan_payment_failure",
        "required": [
            "aadhaar",
            "pmKisanRegistrationNumber",
            "bankAccountProof",
            "paymentStatusScreenshot",
        ],
        "present": ["aadhaar", "pmKisanRegistrationNumber"],
        "missing": ["bankAccountProof", "paymentStatusScreenshot"],
        "completenessPercentage": 50.0,
        "reason": "2 of 4 required evidence items are present (50.0% complete).",
    }
