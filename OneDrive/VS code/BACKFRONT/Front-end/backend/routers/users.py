from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    return {
        "user_id": user_id,
        "name": "Pooja Kashyap",
        "email": "pooja.k@example.com",
        "emergency_contacts_count": 2,
        "is_simulated": True
    }
