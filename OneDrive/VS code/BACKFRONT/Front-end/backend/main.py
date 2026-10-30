"""
SAJAG - FastAPI Application Entry Point
AI/ML Smart Navigation & Safety Platform Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, users, routes, risk, locations, alerts, ml_predict

app = FastAPI(
    title="SAJAG Navigation & Safety API",
    description="Intelligent AI/ML-assisted navigation platform backend with modular route, risk, and safety scoring services.",
    version="2.4.0",
)

# CORS configuration for development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(routes.router)
app.include_router(risk.router)
app.include_router(locations.router)
app.include_router(alerts.router)
app.include_router(ml_predict.router)

@app.get("/")
async def root():
    return {
        "platform": "SAJAG Navigation & Safety Platform",
        "status": "operational",
        "api_version": "2.4.0",
        "ml_engine": "XGBoost-Safety-v1.2-stub",
        "transparency_notice": "Outputs are simulated until connected with live production municipal telemetry."
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
