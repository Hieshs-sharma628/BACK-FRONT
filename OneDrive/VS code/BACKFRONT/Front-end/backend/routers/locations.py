from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/locations", tags=["Location Services"])

@router.get("/safe-havens")
async def get_safe_havens():
    return [
        {
            "id": "safe-1",
            "name": "Chanakyapuri Police Station & Pink Booth",
            "category": "police",
            "lat": 28.5980,
            "lng": 77.1850,
            "open_24x7": True,
            "verified": True,
            "is_simulated": True
        }
    ]
