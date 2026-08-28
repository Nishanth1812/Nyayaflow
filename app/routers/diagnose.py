from fastapi import APIRouter, HTTPException

from app.models import GrievanceCategory
from app.schemas import CategoryDiagnosticRequest, DiagnosticRequest, DiagnosticResponse
from app.services.diagnostic_engine import diagnose_answers, diagnose_category


router = APIRouter(tags=["diagnostics"])


@router.post("/diagnose", response_model=DiagnosticResponse)
def diagnose(request: DiagnosticRequest) -> DiagnosticResponse:
    result = diagnose_answers(request.model_dump(by_alias=True))
    return DiagnosticResponse.model_validate(result)


@router.post("/diagnose/{category}", response_model=DiagnosticResponse)
def diagnose_by_category(
    category: GrievanceCategory, request: CategoryDiagnosticRequest
) -> DiagnosticResponse:
    try:
        result = diagnose_category(category, request.answers)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return DiagnosticResponse.model_validate(result)
