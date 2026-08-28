from fastapi import APIRouter

from backend.schemas import RoutingRequest, RoutingResponse
from backend.services.routing_engine import route_issue


router = APIRouter(tags=["routing"])


@router.post("/route", response_model=RoutingResponse)
def route(request: RoutingRequest) -> RoutingResponse:
    result = route_issue(request.category, request.issue_description)
    return RoutingResponse.model_validate(result)
