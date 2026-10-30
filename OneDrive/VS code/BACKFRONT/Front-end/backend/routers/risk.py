from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

@router.get("/zones")
async def get_risk_zones():
    return [
        {
            "id": "risk-1",
            "title": "Mahipalpur Underpass Waterlogging Advisory",
            "category": "environmental",
            "severity": "moderate",
            "center": [28.5390, 77.1280],
            "radius_meters": 650,
            "is_simulated": True
        }
    ]
