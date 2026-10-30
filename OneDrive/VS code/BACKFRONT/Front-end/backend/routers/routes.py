from fastapi import APIRouter
from backend.models.schemas import RouteRequestSchema, RouteResponseSchema, RouteStepSchema
from typing import List

router = APIRouter(prefix="/routes", tags=["Routes"])

@router.post("/evaluate", response_model=List[RouteResponseSchema])
async def evaluate_routes(request: RouteRequestSchema):
    """
    Evaluates safe routes between origin and destination.
    Simulated response adhering to SAJAG safety routing criteria.
    """
    return [
        RouteResponseSchema(
            route_id="route-safest",
            name="NH-48 Verified Safe Corridor",
            distance_km=28.4,
            duration_minutes=38,
            safety_score=96,
            lighting_percent=100,
            police_checkpoints=4,
            cctv_coverage_percent=94,
            high_risk_zones_passed=0,
            path=[
                [request.origin.lat, request.origin.lng],
                [28.5950, 77.1950],
                [28.5500, 77.1400],
                [28.5100, 77.0980],
                [request.destination.lat, request.destination.lng]
            ],
            steps=[
                RouteStepSchema(
                    instruction="Merge onto NH-48 Express Corridor via Dhaula Kuan",
                    distance="14.2 km",
                    duration="18 min",
                    safety_note="100% LED highway illumination; 3 active PCR patrol vehicles stationed",
                    is_caution=False
                )
            ],
            is_simulated=True
        )
    ]
