from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("/active")
async def get_active_alerts():
    return [
        {
            "id": "alert-1",
            "title": "Dhaula Kuan Junction Peak Flow",
            "type": "traffic_advisory",
            "timestamp": "2026-10-30T11:00:00Z",
            "is_simulated": True
        }
    ]
