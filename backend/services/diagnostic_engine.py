from collections.abc import Mapping
from typing import Any, NotRequired, TypedDict

from backend.models import GrievanceCategory


PM_KISAN_DEPARTMENT = "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)"
EPFO_DEPARTMENT = "EPFO Regional PF Commissioner Office"
INCOME_TAX_DEPARTMENT = "CPC-ITR / Income Tax Grievance Cell"
NSP_DEPARTMENT = "National Scholarship Portal Grievance Cell"
NREGA_DEPARTMENT = "Ministry of Rural Development (MGNREGA Cell)"


class DiagnosticFailure(TypedDict):
    message: str
    fix_checklist: list[str]
    fix_title: str
    fix_intro: str
    recommended_action: str


class DiagnosticRule(TypedDict):
    question: str
    field_name: str
    helper: NotRequired[str]
    outcome: NotRequired[str]
    on_no: NotRequired[DiagnosticFailure]
    on_yes: NotRequired[DiagnosticFailure]


DIAGNOSTIC_RULES: dict[GrievanceCategory, tuple[DiagnosticRule, ...]] = {
    GrievanceCategory.PM_KISAN_PAYMENT_FAILURE: (
        {
            "question": "Is your PM-KISAN e-KYC complete?",
            "field_name": "eKycComplete",
            "helper": "e-KYC confirms that the beneficiary record belongs to you.",
            "outcome": "ekyc_incomplete",
            "on_no": {
                "message": "PM-KISAN eKYC is incomplete, so the payment grievance is not ready to file.",
                "fix_checklist": [
                    "Complete PM-KISAN eKYC using the official PM-KISAN portal or an authorised CSC before filing a payment grievance.",
                ],
                "fix_title": "Complete e-KYC first",
                "fix_intro": "Payments usually pause when this identity check is incomplete.",
                "recommended_action": "After e-KYC shows “completed”, come back and file this complaint.",
            },
        },
        {
            "question": "Is Aadhaar seeded with your registered bank account?",
            "field_name": "bankAadhaarSeeded",
            "helper": "The account must be linked to the Aadhaar used for PM-KISAN.",
            "outcome": "bank_aadhaar_not_seeded",
            "on_no": {
                "message": "Aadhaar is not seeded with the registered bank account, which can block PM-KISAN payment delivery.",
                "fix_checklist": [
                    "Contact your bank and ensure that your Aadhaar number is correctly linked to the bank account registered for PM-KISAN.",
                ],
                "fix_title": "Link Aadhaar to your bank account",
                "fix_intro": "Your bank can confirm or update this link without changing your account.",
                "recommended_action": "Ask the bank to re-check the link after 2–3 working days.",
            },
        },
        {
            "question": "Is the Aadhaar-linked account active in the NPCI mapper?",
            "field_name": "npciMappingActive",
            "helper": "NPCI mapping tells the payment system where to send your money.",
            "outcome": "npci_mapping_inactive",
            "on_no": {
                "message": "The Aadhaar-linked account is not active in the NPCI mapper, so Aadhaar-based payment may fail.",
                "fix_checklist": [
                    "Ask your bank to verify that the Aadhaar-linked account is active in the NPCI mapper for Aadhaar-based payments.",
                ],
                "fix_title": "Refresh your NPCI mapping",
                "fix_intro": "An inactive mapping can stop an otherwise approved instalment.",
                "recommended_action": "Return here once the bank confirms that mapping is active.",
            },
        },
        {
            "question": "Does your PM-KISAN registration name match the land record?",
            "field_name": "landRecordNameMatch",
            "helper": "The name on the PM-KISAN record should match the state land record.",
            "outcome": "land_record_name_mismatch",
            "on_no": {
                "message": "The PM-KISAN registration name does not match the relevant land record, which can prevent beneficiary validation.",
                "fix_checklist": [
                    "Verify that your name in the PM-KISAN registration matches the relevant land records and request correction through the appropriate state agriculture or land-record authority.",
                ],
                "fix_title": "Correct the land-record name mismatch",
                "fix_intro": "Even a small spelling difference can hold a payment for review.",
                "recommended_action": "Ask the PM-KISAN nodal officer to re-verify after the correction.",
            },
        },
    ),
    GrievanceCategory.EPFO_CLAIM_REJECTED: (
        {
            "question": "Does your name match exactly across Aadhaar, PAN, and EPFO UAN records?",
            "field_name": "nameMatchesRecords",
            "helper": "Your name must match across your identity and UAN records.",
            "on_no": {
                "message": "A name mismatch across identity and UAN records commonly causes EPFO claim rejection.",
                "fix_checklist": [
                    "Submit a Joint Declaration (JD) correction request with supporting identity documents.",
                    "Have the employer approve the JD in the EPFO system and track the correction before refiling.",
                ],
                "fix_title": "Correct the UAN-Aadhaar name mismatch",
                "fix_intro": "A mismatch can cause an otherwise valid PF claim to be rejected.",
                "recommended_action": "Try the claim again after EPFO confirms the correction.",
            },
        },
        {
            "question": "Is your date of birth consistent across Aadhaar and EPFO records?",
            "field_name": "dateOfBirthMatches",
            "helper": "Your date of birth must match across Aadhaar and EPFO records.",
            "on_no": {
                "message": "The date of birth differs between Aadhaar and EPFO records.",
                "fix_checklist": [
                    "Ask the employer to initiate or approve the DOB correction through the Joint Declaration process.",
                    "Attach the accepted proof of date of birth and wait for the member profile to update.",
                ],
                "fix_title": "Update your date of birth",
                "fix_intro": "A DOB mismatch can stop final PF claims.",
                "recommended_action": "Wait for the member profile to refresh before refiling.",
            },
        },
        {
            "question": "Is your bank account linked and verified with your UAN?",
            "field_name": "bankAccountLinkedToUan",
            "helper": "EPFO needs a verified bank account to release a PF withdrawal.",
            "on_no": {
                "message": "The bank account is not seeded and verified against the UAN.",
                "fix_checklist": [
                    "Add the bank account under Manage > KYC in the EPFO member portal.",
                    "Ask the employer to approve the bank KYC and confirm that EPFO shows it as verified.",
                ],
                "fix_title": "Complete your bank KYC",
                "fix_intro": "Unverified bank details can block claim payment.",
                "recommended_action": "Submit the claim again once KYC shows approved.",
            },
        },
        {
            "question": "Did your employer update your date of exit in the EPFO system?",
            "field_name": "employerUpdatedDateOfExit",
            "helper": "The exit date tells EPFO whether the claim is eligible to be processed.",
            "on_no": {
                "message": "The employer has not updated the date of exit required to process the claim.",
                "fix_checklist": [
                    "Ask the employer to update the date and reason of exit in the EPFO employer portal.",
                    "Confirm the exit details appear in service history before refiling.",
                ],
                "fix_title": "Update your date of exit",
                "fix_intro": "A missing or incorrect exit date often stops final PF claims.",
                "recommended_action": "Wait for the service history to refresh before filing again.",
            },
        },
    ),
    GrievanceCategory.INCOME_TAX_REFUND_DELAYED: (
        {
            "question": "Does your ITR match your AIS/Form 26AS exactly (income, TDS entries)?",
            "field_name": "itrMatchesAis26as",
            "helper": "Your filed return should match your AIS and Form 26AS.",
            "on_no": {
                "message": "The filed ITR does not match AIS/Form 26AS income or TDS entries.",
                "fix_checklist": [
                    "Reconcile the return against AIS and Form 26AS.",
                    "Submit feedback for incorrect AIS data or file a revised return when the filed return is incorrect.",
                ],
                "fix_title": "Reconcile your return with AIS/26AS",
                "fix_intro": "A mismatch can pause refund processing.",
                "recommended_action": "Submit feedback for incorrect AIS data or file a revised return.",
            },
        },
        {
            "question": "Do you have any past disputed tax demand under Section 245?",
            "field_name": "hasSection245Demand",
            "helper": "An outstanding demand can adjust or block your refund.",
            "on_yes": {
                "message": "The refund may be adjusted against an outstanding demand under Section 245.",
                "fix_checklist": [
                    "Open the Section 245 notice in the income-tax portal and verify the demand details.",
                    "Respond by agreeing, partially agreeing, or disagreeing with evidence before the response deadline.",
                ],
                "fix_title": "Respond to the Section 245 notice",
                "fix_intro": "An unresolved demand can reduce or hold your refund.",
                "recommended_action": "Respond to the notice with evidence before the deadline.",
            },
        },
        {
            "question": "Has your ITR been verified (e-verified within 30 days of filing)?",
            "field_name": "itrVerified",
            "helper": "The department starts processing a refund only after verification.",
            "on_no": {
                "message": "The ITR was not e-verified within the required filing window.",
                "fix_checklist": [
                    "Use the income-tax portal's e-Verify Return service and complete verification through an available method.",
                    "If the time limit expired, submit a condonation-of-delay request where available.",
                ],
                "fix_title": "Verify your income-tax return",
                "fix_intro": "An unverified return remains incomplete even after filing.",
                "recommended_action": "Allow processing time after successful verification.",
            },
        },
    ),
    GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK: (
        {
            "question": "Is your e-KYC / Aadhaar seeding complete on the NSP portal?",
            "field_name": "eKycAadhaarSeeded",
            "helper": "NSP needs Aadhaar authentication/e-KYC before payment.",
            "on_no": {
                "message": "NSP e-KYC or Aadhaar seeding is incomplete.",
                "fix_checklist": [
                    "Complete Aadhaar authentication/e-KYC in the NSP applicant portal.",
                    "Confirm that the seeded bank account and identity details are accepted before continuing.",
                ],
                "fix_title": "Complete NSP e-KYC / Aadhaar seeding",
                "fix_intro": "A missing link can hold an approved scholarship payment.",
                "recommended_action": "Confirm the seeded details are accepted before continuing.",
            },
        },
        {
            "question": "Has your institute verified your application?",
            "field_name": "instituteVerified",
            "helper": "Your school or college must verify the application before the department approves it.",
            "on_no": {
                "message": "The application is waiting for institute verification, a common silent bottleneck.",
                "fix_checklist": [
                    "Follow up first with the institute nodal officer and provide any pending documents.",
                    "Ask the institute to verify and forward the application in NSP.",
                ],
                "fix_title": "Ask your institute to verify it",
                "fix_intro": "Institute verification is a required step before payment.",
                "recommended_action": "Check the portal again after institute verification.",
            },
        },
        {
            "question": "Has your state/district nodal officer approved it after institute verification?",
            "field_name": "stateDistrictApproved",
            "helper": "State or district nodals approve the application after the institute.",
            "on_no": {
                "message": "Institute verification is complete, but state/district nodal approval is still pending.",
                "fix_checklist": [
                    "Contact the relevant state or district nodal officer with the NSP application reference.",
                    "Request completion of the post-institute approval stage.",
                ],
                "fix_title": "Get state/district approval",
                "fix_intro": "Payment stays pending until post-institute approval completes.",
                "recommended_action": "Request completion of the post-institute approval stage.",
            },
        },
    ),
    GrievanceCategory.NREGA_WAGE_DELAYED: (
        {
            "question": "Is your MGNREGA job card Aadhaar-seeded?",
            "field_name": "jobCardAadhaarSeeded",
            "helper": "The job card must be linked to Aadhaar to receive wages directly.",
            "on_no": {
                "message": "The MGNREGA job card is not Aadhaar-seeded, which can block wage payment.",
                "fix_checklist": [
                    "Visit your Gram Panchayat or the local CSC and complete Aadhaar seeding for the job card.",
                    "Confirm the job-card number appears against the correct Aadhaar in the NREGA portal.",
                ],
                "fix_title": "Seed your job card with Aadhaar",
                "fix_intro": "Wages are paid to the Aadhaar-linked account, so the link must be correct.",
                "recommended_action": "Confirm the job-card link after 2–3 working days.",
            },
        },
        {
            "question": "Is the wage bank account Aadhaar-seeded?",
            "field_name": "bankAccountAadhaarSeeded",
            "helper": "Wages are credited to the bank account linked to the job-card Aadhaar.",
            "on_no": {
                "message": "The wage bank account is not Aadhaar-seeded.",
                "fix_checklist": [
                    "Ask your bank to seed the bank account with the same Aadhaar used for the job card.",
                    "Keep the bank acknowledgement for the wage account.",
                ],
                "fix_title": "Link Aadhaar to the wage account",
                "fix_intro": "An unseeded account can hold an approved wage payment.",
                "recommended_action": "Ask the bank to re-check the link after 2–3 working days.",
            },
        },
        {
            "question": "Is your work recorded in the muster roll?",
            "field_name": "workInMusterRoll",
            "helper": "Muster rolls record the days worked; wages are calculated from them.",
            "on_no": {
                "message": "The work done is not recorded in the muster roll.",
                "fix_checklist": [
                    "Ask the mate/ward member to record your attendance in the muster roll.",
                    "Check that the work-site attendance matches the days you actually worked.",
                ],
                "fix_title": "Get your work recorded in the muster roll",
                "fix_intro": "Wages cannot be processed without muster-roll entries.",
                "recommended_action": "Verify the muster entry before raising a wage complaint.",
            },
        },
        {
            "question": "Has the completed work been measured and verified?",
            "field_name": "workMeasuredVerified",
            "helper": "Measurement and social audit verify the work so wages can be released.",
            "on_no": {
                "message": "The completed work has not been measured and verified.",
                "fix_checklist": [
                    "Request measurement of the completed work by the Panchayat/technical officer.",
                    "Attend the social audit if your work is listed for verification.",
                ],
                "fix_title": "Get the work measured and verified",
                "fix_intro": "Unmeasured work stays pending in the wage pipeline.",
                "recommended_action": "Follow up after the measurement and verification is done.",
            },
        },
    ),
}

READY_TO_FILE: dict[GrievanceCategory, tuple[str, str]] = {
    GrievanceCategory.PM_KISAN_PAYMENT_FAILURE: (
        PM_KISAN_DEPARTMENT,
        "The issue can now be filed as a PM-KISAN payment grievance.",
    ),
    GrievanceCategory.EPFO_CLAIM_REJECTED: (
        EPFO_DEPARTMENT,
        "File the grievance through EPFiGMS for the Regional PF Commissioner Office.",
    ),
    GrievanceCategory.INCOME_TAX_REFUND_DELAYED: (
        INCOME_TAX_DEPARTMENT,
        "File with the CPC-ITR / Income Tax Grievance Cell. When an eligible refund is delayed beyond the department's control, interest under Section 244A accrues at 0.5% monthly; calculate it as refund amount × 0.005 × eligible months.",
    ),
    GrievanceCategory.SCHOLARSHIP_NSP_PAYMENT_STUCK: (
        NSP_DEPARTMENT,
        "File the payment grievance with the National Scholarship Portal Grievance Cell.",
    ),
    GrievanceCategory.NREGA_WAGE_DELAYED: (
        NREGA_DEPARTMENT,
        "File the wage grievance with the Ministry of Rural Development MGNREGA Cell.",
    ),
}


def _format_checklist(items: list[str]) -> str:
    if len(items) == 1:
        return items[0]
    return " ".join(f"{index}. {item}" for index, item in enumerate(items, 1))


def diagnose_category(
    category: GrievanceCategory, answers: Mapping[str, bool]
) -> dict[str, Any]:
    rules = DIAGNOSTIC_RULES[category]
    missing = [rule["field_name"] for rule in rules if rule["field_name"] not in answers]
    if missing:
        raise ValueError(f"Missing diagnostic answers: {', '.join(missing)}.")
    expected_fields = {rule["field_name"] for rule in rules}
    unexpected = sorted(set(answers) - expected_fields)
    if unexpected:
        raise ValueError(f"Unexpected diagnostic answers: {', '.join(unexpected)}.")

    for rule in rules:
        field_name = rule["field_name"]
        blocking_answer = "on_yes" in rule
        if answers[field_name] is blocking_answer:
            failure = rule["on_yes"] if blocking_answer else rule["on_no"]
            return {
                "outcome": rule.get("outcome", "prerequisite_not_met"),
                "failedCheck": field_name,
                "reason": failure["message"],
                "actionableFix": _format_checklist(failure["fix_checklist"]),
                "recommendedDepartment": None,
            }

    department, filing_note = READY_TO_FILE[category]
    return {
        "outcome": "ready_to_file",
        "failedCheck": None,
        "reason": "All prerequisite checks passed.",
        "actionableFix": filing_note,
        "recommendedDepartment": department,
    }


def diagnose_answers(answers: Mapping[str, bool]) -> dict[str, Any]:
    """Evaluate the first failed PM-KISAN prerequisite in strict rule order."""
    return diagnose_category(GrievanceCategory.PM_KISAN_PAYMENT_FAILURE, answers)
