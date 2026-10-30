from fastapi import APIRouter
from backend.models.schemas import SafetyPredictRequest, SafetyPredictResponse
from backend.ml.safety_model import safety_model_pipeline

router = APIRouter(prefix="/ml", tags=["AI/ML Predictions"])

@router.post("/predict-risk", response_model=SafetyPredictResponse)
async def predict_route_safety(payload: SafetyPredictRequest):
    """
    ML Safety Score prediction endpoint.
    Processes road features through the safety model pipeline.
    """
    result = safety_model_pipeline.predict_safety_score(payload.model_dump())
    return SafetyPredictResponse(**result)
