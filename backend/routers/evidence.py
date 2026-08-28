from fastapi import APIRouter, HTTPException, status

from backend.schemas import EvidenceCheckRequest, EvidenceCheckResponse
from backend.services.evidence_checker import check_evidence


router = APIRouter(tags=["evidence"])


@router.post("/evidence-check", response_model=EvidenceCheckResponse)
def evidence_check(request: EvidenceCheckRequest) -> EvidenceCheckResponse:
    try:
        result = check_evidence(request.category, request.evidence)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return EvidenceCheckResponse.model_validate(result)
