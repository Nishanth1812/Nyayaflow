from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from backend.models import CaseStatus, CitizenConfirmation, GrievanceCategory


ShortText = Annotated[str, Field(min_length=1, max_length=200)]
ComplaintText = Annotated[str, Field(min_length=1, max_length=5000)]
CategoryText = Annotated[
    str,
    Field(
        min_length=1,
        max_length=200,
        json_schema_extra={
            "enum": [category.value for category in GrievanceCategory]
        },
    ),
]


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )


class DiagnosticRequest(ApiModel):
    e_kyc_complete: bool = Field(alias="eKycComplete")
    bank_aadhaar_seeded: bool
    npci_mapping_active: bool
    land_record_name_match: bool


class DiagnosticResponse(ApiModel):
    outcome: str
    failed_check: str | None
    reason: str
    actionable_fix: str
    recommended_department: str | None


class CategoryDiagnosticRequest(ApiModel):
    answers: dict[str, bool]


class RoutingRequest(ApiModel):
    category: ShortText
    issue_description: ComplaintText


class RoutingResponse(ApiModel):
    department: str
    reason: str
    matched_rule: str


class DiagnosticRuleView(ApiModel):
    key: str
    question: str
    helper: str = ""
    fix_title: str
    fix_intro: str
    fix_items: list[str]
    recommended_action: str
    blocking_answer: str


class DiagnosticRulesResponse(ApiModel):
    category: str
    questions: list[DiagnosticRuleView]
    routing: RoutingResponse


class EvidenceCheckRequest(ApiModel):
    category: ShortText
    evidence: dict[str, bool]


class EvidenceCheckResponse(ApiModel):
    category: str
    required: list[str]
    present: list[str]
    missing: list[str]
    completeness_percentage: float = Field(ge=0, le=100)
    reason: str


class EvidenceItem(ApiModel):
    type: ShortText
    description: Annotated[str, Field(min_length=1, max_length=500)]
    present: bool


class TimelineEvent(ApiModel):
    stage: CaseStatus
    timestamp: datetime
    note: Annotated[str, Field(min_length=1, max_length=1000)]


class CaseCreate(ApiModel):
    category: CategoryText
    complaint_text: ComplaintText
    diagnostic_answers: dict[str, bool]
    routed_department: ShortText
    routing_reason: Annotated[str, Field(min_length=1, max_length=1000)]
    evidence: list[EvidenceItem]


class CaseResponse(ApiModel):
    id: int
    category: str
    complaint_text: str
    diagnostic_answers: dict[str, bool]
    status: CaseStatus
    status_plain_language: str
    routed_department: str
    routing_reason: str
    evidence: list[EvidenceItem]
    timeline: list[TimelineEvent]
    citizen_confirmed: CitizenConfirmation
    appeal_draft: str | None
    audit_hash: str = ""
    created_at: datetime
    updated_at: datetime


class CaseStatusResponse(ApiModel):
    status: CaseStatus
    status_plain_language: str


class CitizenResolution(str, Enum):
    YES = "yes"
    PARTIAL = "partial"
    NO = "no"
    WRONG_DEPT = "wrong_dept"


class ConfirmationRequest(ApiModel):
    citizen_confirmed: CitizenResolution


class ConfirmationResponse(ApiModel):
    case_id: int
    citizen_confirmed: CitizenConfirmation
    appeal_generated: bool
    appeal_draft: str | None
    explanation: str
    case: CaseResponse


class MetricsResponse(ApiModel):
    total_cases: int
    correctly_routed_percentage: float
    citizen_confirmed_resolution_rate: float
    average_time_to_first_response_minutes: float


class HealthResponse(ApiModel):
    status: str
    service: str
