from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/verify-token")
async def verify_token(token_data: Dict[str, str]):
    """
    Verifies Firebase JWT token and returns user claims.
    """
    return {
        "status": "success",
        "uid": "usr_demo",
        "email": "user@sajag.live",
        "is_authenticated": True,
        "is_simulated": True
    }
