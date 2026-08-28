from fastapi import APIRouter

from backend.models import GrievanceCategory
from backend.schemas import DiagnosticRulesResponse, RoutingResponse
from backend.services.diagnostic_engine import DIAGNOSTIC_RULES
from backend.services.routing_engine import route_issue


router = APIRouter(tags=["diagnostic-rules"])


def _build_check(rule: dict) -> dict:
    failure = rule.get("on_yes") if "on_yes" in rule else rule.get("on_no")
    blocking_answer = "yes" if "on_yes" in rule else "no"
    return {
        "key": rule["field_name"],
        "question": rule["question"],
        "helper": rule.get("helper", ""),
        "fix_title": failure["fix_title"],
        "fix_intro": failure["fix_intro"],
        "fix_items": failure["fix_checklist"],
        "recommended_action": failure["recommended_action"],
        "blocking_answer": blocking_answer,
    }


def _build_rules(category: GrievanceCategory) -> dict:
    routing: RoutingResponse = RoutingResponse.model_validate(
        route_issue(category.value, "")
    )
    questions = [_build_check(rule) for rule in DIAGNOSTIC_RULES[category]]
    return {
        "category": category.value,
        "questions": questions,
        "routing": routing.model_dump(),
    }


@router.get("/diagnostic-rules", response_model=list[DiagnosticRulesResponse])
def list_diagnostic_rules() -> list[dict]:
    return [_build_rules(category) for category in GrievanceCategory]


@router.get("/diagnostic-rules/{category}", response_model=DiagnosticRulesResponse)
def get_diagnostic_rules(category: GrievanceCategory) -> dict:
    return _build_rules(category)
