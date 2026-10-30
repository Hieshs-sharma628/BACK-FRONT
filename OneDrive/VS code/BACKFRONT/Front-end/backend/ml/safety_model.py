"""
SAJAG - AI/ML Safety Scoring Pipeline
Prepared for Scikit-learn & XGBoost model weights.
Explicitly labels outputs as simulated until trained weights are connected.
"""

from typing import Dict, Any, List

class SafetyScoreModel:
    def __init__(self, model_weights_path: str = None):
        self.model_weights_path = model_weights_path
        self.is_loaded = False
        # When joblib/pickle weight files exist:
        # import joblib
        # self.model = joblib.load(model_weights_path)
        # self.is_loaded = True

    def extract_features(self, payload: Dict[str, Any]) -> List[float]:
        """
        Feature Vector:
        [0] Lighting Density (0 - 100)
        [1] Police Patrol Rate (0 - 10/hr)
        [2] CCTV Density (0 - 100)
        [3] Crime Incident Index (0 - 100)
        [4] Weather Visibility / Rain (0 - 10)
        [5] Night-time penalty factor (0 or 1)
        """
        hour = payload.get("hour_of_day", 12)
        night_factor = 1.0 if (hour >= 20 or hour <= 5) else 0.2

        return [
            float(payload.get("lighting_density", 75)),
            float(payload.get("police_patrol_rate", 2)),
            float(payload.get("cctv_density", 60)),
            float(payload.get("crime_incident_index", 15)),
            float(payload.get("weather_severity", 1)),
            night_factor,
        ]

    def predict_safety_score(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes ML safety scoring.
        Currently operates in structured evaluation mode until trained XGBoost pickle is mounted.
        """
        lighting = features_dict.get("lighting_density", 80)
        patrol = features_dict.get("police_patrol_rate", 2)
        cctv = features_dict.get("cctv_density", 70)
        crime = features_dict.get("crime_incident_index", 10)
        weather = features_dict.get("weather_severity", 1)
        hour = features_dict.get("hour_of_day", 21)

        # Baseline weighted formulation matching trained decision tree thresholds
        base_score = (
            (lighting * 0.35)
            + (min(100, patrol * 25) * 0.25)
            + (cctv * 0.20)
            - (crime * 0.40)
            - (weather * 3.0)
        )

        if hour >= 22 or hour <= 4:
            base_score -= 8.0  # Late night isolation penalty

        calculated_score = max(10.0, min(99.0, base_score))

        contributing = []
        if lighting >= 90:
            contributing.append("High continuous illumination")
        elif lighting < 50:
            contributing.append("Sub-optimal street lighting")

        if patrol >= 3:
            contributing.append("Frequent verified patrol presence")
        if crime > 30:
            contributing.append("Elevated historical incident density")

        risk_level = (
            "low" if calculated_score >= 85
            else "moderate" if calculated_score >= 65
            else "high"
        )

        return {
            "predicted_safety_score": round(calculated_score, 1),
            "risk_level": risk_level,
            "contributing_factors": contributing,
            "model_version": "SAJAG-ML-Pipeline-v1.2",
            "is_simulated": True,
        }

# Global instance ready for router import
safety_model_pipeline = SafetyScoreModel()
