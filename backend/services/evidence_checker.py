from collections.abc import Mapping
from typing import Any


EVIDENCE_REQUIREMENTS: dict[str, tuple[str, ...]] = {
    "pm_kisan_payment_failure": (
        "aadhaar",
        "pmKisanRegistrationNumber",
        "bankAccountProof",
        "paymentStatusScreenshot",
    )
}


def check_evidence(category: str, evidence: Mapping[str, bool]) -> dict[str, Any]:
    """Compare provided evidence with the category's explicit requirement list."""
    if category not in EVIDENCE_REQUIREMENTS:
        raise ValueError(f"No evidence rule is configured for category '{category}'.")

    required = list(EVIDENCE_REQUIREMENTS[category])
    present = [item for item in required if evidence.get(item, False)]
    missing = [item for item in required if not evidence.get(item, False)]
    percentage = round((len(present) / len(required)) * 100, 2)

    return {
        "category": category,
        "required": required,
        "present": present,
        "missing": missing,
        "completenessPercentage": percentage,
        "reason": (
            f"{len(present)} of {len(required)} required evidence items are present "
            f"({percentage}% complete)."
        ),
    }
