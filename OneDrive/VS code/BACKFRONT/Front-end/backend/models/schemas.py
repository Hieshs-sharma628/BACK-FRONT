from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class CoordinatesSchema(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None
    address: Optional[str] = None

class RouteRequestSchema(BaseModel):
    origin: CoordinatesSchema
    destination: CoordinatesSchema
    prefer_safety: bool = True
    avoid_unlit_roads: bool = True
    time_of_travel: Optional[str] = "night"

class RouteStepSchema(BaseModel):
    instruction: str
    distance: str
    duration: str
    safety_note: Optional[str] = None
    is_caution: bool = False

class RouteResponseSchema(BaseModel):
    route_id: str
    name: str
    distance_km: float
    duration_minutes: int
    safety_score: int
    lighting_percent: int
    police_checkpoints: int
    cctv_coverage_percent: int
    high_risk_zones_passed: int
    path: List[List[float]]
    steps: List[RouteStepSchema]
    is_simulated: bool = True

class RiskZoneSchema(BaseModel):
    id: str
    title: str
    category: Literal["environmental", "infrastructure", "security", "accident_blackspot"]
    severity: Literal["low", "moderate", "high", "critical"]
    center_lat: float
    center_lng: float
    radius_meters: float
    description: str
    is_simulated: bool = True

class SafetyPredictRequest(BaseModel):
    lighting_density: float = Field(..., ge=0, le=100, description="Percentage of functional lighting")
    police_patrol_rate: float = Field(..., ge=0, le=10, description="Patrol frequency per hour")
    crime_incident_index: float = Field(..., ge=0, le=100, description="Historical incident index")
    weather_severity: float = Field(..., ge=0, le=10, description="Rain/fog severity factor")
    cctv_density: float = Field(..., ge=0, le=100, description="Percentage of CCTV coverage")
    hour_of_day: int = Field(..., ge=0, le=23)

class SafetyPredictResponse(BaseModel):
    predicted_safety_score: float = Field(..., ge=0, le=100)
    risk_level: Literal["low", "moderate", "high", "critical"]
    contributing_factors: List[str]
    model_version: str = "XGBoost-Safety-v1.2-stub"
    is_simulated: bool = True
