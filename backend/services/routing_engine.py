import re
from collections.abc import Sequence
from typing import TypedDict

from backend.services.diagnostic_engine import (
    EPFO_DEPARTMENT,
    INCOME_TAX_DEPARTMENT,
    NREGA_DEPARTMENT,
    NSP_DEPARTMENT,
    PM_KISAN_DEPARTMENT,
)


class RoutingRule(TypedDict):
    name: str
    keywords: Sequence[tuple[str, str]]
    department: str
    subject: str


ROUTING_RULES: tuple[RoutingRule, ...] = (
    {
        "name": "epfo",
        "keywords": (
            ("uan", "UAN"),
            ("epfo", "EPFO"),
            ("epf", "EPF"),
            ("provident fund", "provident fund"),
            ("pf", "PF"),
        ),
        "department": EPFO_DEPARTMENT,
        "subject": "EPFO provident-fund grievances",
    },
    {
        "name": "income_tax",
        "keywords": (
            ("refund", "refund"),
            ("itr", "ITR"),
            ("income tax", "income tax"),
            ("26as", "26AS"),
            ("tax return", "tax return"),
        ),
        "department": INCOME_TAX_DEPARTMENT,
        "subject": "income-tax return and refund grievances",
    },
    {
        "name": "scholarship_nsp",
        "keywords": (
            ("scholarship", "scholarship"),
            ("nsp", "NSP"),
            ("stipend", "stipend"),
        ),
        "department": NSP_DEPARTMENT,
        "subject": "National Scholarship Portal payment grievances",
    },
    {
        "name": "pension",
        "keywords": (
            ("pension payment order", "pension payment order"),
            ("pension", "pension"),
            ("ppo", "PPO"),
        ),
        "department": "Department of Pension and Pensioners' Welfare (DoPPW)",
        "subject": "pension grievances",
    },
    {
        "name": "nrega",
        "keywords": (
            ("nrega", "NREGA"),
            ("mgnrega", "MGNREGA"),
            ("job card", "job card"),
            ("wage", "wage"),
            ("muster", "muster roll"),
        ),
        "department": NREGA_DEPARTMENT,
        "subject": "MGNREGA wage grievances",
    },
)

PM_KISAN_CONTEXT: tuple[tuple[str, str], ...] = (
    ("pm-kisan", "PM-KISAN"),
    ("pm kisan", "PM-KISAN"),
    ("farmer", "farmer"),
)
PAYMENT_CONTEXT: tuple[tuple[str, str], ...] = (
    ("instalment", "instalment"),
    ("installment", "installment"),
    ("payment", "payment"),
)


def _first_keyword(
    text: str, keywords: Sequence[tuple[str, str]]
) -> tuple[str, str] | None:
    return next(
        (
            (keyword, label)
            for keyword, label in keywords
            if re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text)
        ),
        None,
    )


def route_issue(category: str, issue_description: str) -> dict[str, str]:
    """Route an issue using ordered, case-insensitive keyword matching."""
    text = f"{category.replace('_', ' ')} {issue_description}".lower()
    pm_match = _first_keyword(text, PM_KISAN_CONTEXT)
    payment_match = _first_keyword(text, PAYMENT_CONTEXT)
    if pm_match and payment_match:
        return {
            "department": PM_KISAN_DEPARTMENT,
            "reason": (
                f"The issue mentions '{pm_match[1]}' and '{payment_match[1]}', which "
                "match the PM-KISAN payment/instalment routing rule."
            ),
            "matchedRule": "pm_kisan_payment",
        }

    for rule in ROUTING_RULES:
        matched = _first_keyword(text, rule["keywords"])
        if matched:
            return {
                "department": rule["department"],
                "reason": (
                    f"The issue mentions '{matched[1]}', which matches the "
                    f"{rule['subject']} routing rule."
                ),
                "matchedRule": rule["name"],
            }

    return {
        "department": "General CPGRAMS — needs manual categorization",
        "reason": (
            "No configured routing rule matched the category or issue description; "
            "manual categorization is required."
        ),
        "matchedRule": "fallback",
    }
