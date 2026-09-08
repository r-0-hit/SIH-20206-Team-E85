"""
THERMOSAFE — Machine Learning & Geospatial Inference Microservice.
FastAPI service providing real-time AI classification of thermal anomalies,
Facility Digital Twin baselines, future risk prediction, What-If simulation,
and SHAP-powered explainable risk scores.
"""

import json
import os
import time
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.core.explainer import (
    calculate_risk_score,
    generate_indicators,
    generate_recommendations,
    generate_shap_explanation,
    FEATURE_LABELS,
)
from ml.core.feature_engineering import extract_features, FEATURE_NAMES
from ml.core.geo_catalog import (
    INDUSTRIAL_FACILITIES,
    find_nearest_industrial_facility,
    register_osm_facility,
    bulk_register_osm_facilities,
)
from ml.core.persistence import PersistenceTracker
from ml.core.thermal_twin import (
    get_or_create_twin,
    detect_facility_anomaly,
    update_facility_baseline,
    TWIN_REGISTRY,
)
from ml.core.predictor import risk_predictor

app = FastAPI(
    title="THERMOSAFE — Thermal Classification & Digital Twin Intelligence Service",
    version="2.0.0",
    description=(
        "AI-driven classification of industrial fires, Facility Digital Twin baselines, "
        "predictive risk timelines (30/60/120 min), and What-If scenario simulation."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Loading ─────────────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "classifier.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_meta.json")

pipeline = None
model_meta = {}
persistence_tracker = PersistenceTracker()

if os.path.exists(MODEL_PATH):
    try:
        pipeline = joblib.load(MODEL_PATH)
        print("[SUCCESS] Classifier pipeline loaded successfully.")
    except Exception as e:
        print(f"[WARNING] Failed to load model from {MODEL_PATH}: {e}")

if os.path.exists(META_PATH):
    try:
        with open(META_PATH, "r") as f:
            model_meta = json.load(f)
    except Exception as e:
        print(f"[WARNING] Failed to load metadata: {e}")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class AnomalyInput(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    brightness: float = Field(..., ge=250.0, le=600.0, description="Brightness temperature in Kelvin")
    frp: float = Field(..., ge=0.1, le=2000.0, description="Fire Radiative Power in Megawatts")
    daynight: Optional[str] = Field("N", description="D for Day, N for Night")
    confidence: Optional[Any] = Field("nominal", description="Confidence score (0-100 or 'low'/'nominal'/'high')")
    acq_date: Optional[str] = Field(None, description="Acquisition date (YYYY-MM-DD)")
    acq_time: Optional[str] = Field(None, description="Acquisition time (HHMM)")
    satellite: Optional[str] = Field("VIIRS", description="Satellite sensor (VIIRS, MODIS)")
    persistence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Pre-computed persistence score")


class BatchAnomalyInput(BaseModel):
    anomalies: List[AnomalyInput]


class WhatIfInput(BaseModel):
    base_frp: float = Field(..., ge=0.1, le=2000.0, description="Current FRP in MW")
    growth_rate_pct: float = Field(..., ge=0.0, le=300.0, description="Projected FRP growth rate per satellite revisit (%)")
    persistence_score: float = Field(0.1, ge=0.0, le=1.0, description="Historical persistence score")
    population_thousands: float = Field(0.0, ge=0.0, le=10000.0, description="Population within 3km (thousands)")
    distance_km: float = Field(5.0, ge=0.0, le=100.0, description="Distance to nearest industrial facility (km)")
    facility_type: Optional[str] = Field("chemical", description="Facility type: chemical | refinery | power | steel | warehouse | other")


class FacilityInput(BaseModel):
    id: str = Field(..., description="Unique facility identifier (e.g. OSM-12345)")
    name: str = Field(..., description="Facility name")
    type: Optional[str] = Field("industrial", description="Facility category")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude")
    country: Optional[str] = Field("India", description="Country")
    risk_category: Optional[str] = Field("HIGH", description="Risk classification tier")
    operational_flaring: Optional[bool] = Field(False, description="Has operational flaring")
    buffer_km: Optional[float] = Field(3.0, description="Industrial perimeter buffer in km")


class BulkFacilityInput(BaseModel):
    facilities: List[FacilityInput]


# ── Health & Metadata ─────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
def health_check():
    """Health check: model readiness, twin registry status, service version."""
    return {
        "status": "healthy",
        "service": "THERMOSAFE AI Inference Service",
        "version": "2.0.0",
        "model_loaded": pipeline is not None,
        "timestamp": time.time(),
        "facilities_cataloged": len(INDUSTRIAL_FACILITIES),
        "thermal_twins_loaded": len(TWIN_REGISTRY),
    }


@app.get("/model-info", tags=["system"])
def get_model_info():
    """Returns model architecture, training performance metrics, and feature importances."""
    if not model_meta:
        raise HTTPException(status_code=503, detail="Model metadata is unavailable")
    return {"success": True, "metadata": model_meta}


@app.get("/facilities", tags=["facilities"])
def list_facilities():
    """Returns the catalog of registered industrial facilities for GIS overlays."""
    osm_count = sum(1 for f in INDUSTRIAL_FACILITIES if f.get("is_osm_dynamic"))
    seed_count = len(INDUSTRIAL_FACILITIES) - osm_count
    return {
        "success": True,
        "total": len(INDUSTRIAL_FACILITIES),
        "seed_facilities": seed_count,
        "osm_dynamic_facilities": osm_count,
        "facilities": INDUSTRIAL_FACILITIES,
    }


@app.post("/facilities/register", tags=["facilities"])
def register_facility_endpoint(payload: FacilityInput):
    """Registers a dynamic OSM industrial facility into the active in-memory catalog."""
    fac_dict = payload.dict()
    added = register_osm_facility(fac_dict)
    return {
        "success": True,
        "added": 1 if added else 0,
        "total_cataloged": len(INDUSTRIAL_FACILITIES),
        "facility": fac_dict,
        "message": f"Facility '{payload.name}' ({payload.id}) {'registered' if added else 'already registered'}.",
    }


@app.post("/facilities/bulk-register", tags=["facilities"])
def bulk_register_facilities_endpoint(payload: BulkFacilityInput):
    """Bulk registers multiple dynamic OSM industrial facilities into the active in-memory catalog."""
    fac_dicts = [f.dict() for f in payload.facilities]
    added = bulk_register_osm_facilities(fac_dicts)
    return {
        "success": True,
        "added": added,
        "total_cataloged": len(INDUSTRIAL_FACILITIES),
        "message": f"Successfully registered {added} new facilities from OpenStreetMap.",
    }


# ── Core Prediction ───────────────────────────────────────────────────────────

@app.post("/predict", tags=["prediction"])
def predict_anomaly(data: AnomalyInput):
    """
    Main inference endpoint. Returns:
    - Classification category + probability
    - 0-100 composite risk score
    - Facility Digital Twin anomaly assessment
    - SHAP-powered explainability
    - Actionable SOP recommendations
    """
    start_time = time.time()

    if pipeline is None:
        raise HTTPException(status_code=503, detail="Classification model is not loaded")

    # 1. Feature extraction
    features, metadata = extract_features(
        lat=data.lat,
        lon=data.lon,
        brightness=data.brightness,
        frp=data.frp,
        confidence=data.confidence,
        daynight=data.daynight or "N",
        persistence_score=data.persistence_score,
    )

    # 2. Thermal Twin anomaly check
    facility_id = metadata["nearest_facility"]["id"]
    current_hour = 12  # default midday
    if data.acq_time:
        try:
            current_hour = int(str(data.acq_time).zfill(4)[:2])
        except ValueError:
            current_hour = 12

    twin_result = update_facility_baseline(facility_id, data.frp, current_hour)
    metadata["thermal_twin"] = twin_result

    # 3. Extend features with twin anomaly values (12-feature vector)
    z_score = twin_result.get("z_score", 0.0)
    anomaly_ratio = twin_result.get("anomaly_ratio", 1.0)
    extended_features = features + [float(z_score), float(anomaly_ratio)]
    feature_arr = np.array([extended_features])

    # Handle model trained on 10 features (graceful backward compat)
    if pipeline is not None:
        try:
            n_features = pipeline.n_features_in_
        except AttributeError:
            try:
                n_features = pipeline.steps[-1][1].n_features_in_
            except Exception:
                n_features = len(features)

        if n_features == len(features):
            feature_arr = np.array([features])

    # 4. Model inference
    prediction_label = pipeline.predict(feature_arr)[0]
    probabilities = pipeline.predict_proba(feature_arr)[0]
    classes = pipeline.classes_

    prob_dict = {
        cls_name: round(float(prob), 4)
        for cls_name, prob in zip(classes, probabilities)
    }
    top_confidence = float(max(probabilities))

    # 5. Persistence check
    pers = metadata["persistence"]
    is_persistent = pers.get("is_persistent", False)

    # 6. Risk score (anomaly-aware)
    dist_ind = metadata["nearest_facility"]["distance_km"]
    is_night = metadata["daynight"] == "Night"
    risk_score = calculate_risk_score(
        classification=prediction_label,
        confidence=top_confidence,
        frp=data.frp,
        brightness=data.brightness,
        dist_to_industrial=dist_ind,
        persistence_score=pers.get("persistence_score", 0.0),
        is_night=is_night,
    )

    # 7. Explainability
    indicators = generate_indicators(prediction_label, metadata, top_confidence)
    recommendations = generate_recommendations(prediction_label, risk_score, metadata)

    # 8. SHAP explanation
    used_feature_names = FEATURE_NAMES if feature_arr.shape[1] == len(FEATURE_NAMES) else (
        FEATURE_NAMES + ["thermal_anomaly_z_score", "anomaly_ratio"]
    )
    shap_explanation = generate_shap_explanation(pipeline, feature_arr[0].tolist(), used_feature_names)

    # 9. Future risk timeline projection (+30, +60, +120 min)
    hotspot_data = {
        "frp": data.frp,
        "brightness": data.brightness,
        "classification": prediction_label,
        "confidence": top_confidence,
        "dist_to_industrial": dist_ind,
        "persistence_score": pers.get("persistence_score", 0.1),
        "is_night": is_night,
        "thermal_anomaly_z_score": twin_result.get("z_score", 0.0),
        "anomaly_ratio": twin_result.get("anomaly_ratio", 1.0),
    }
    prediction_timeline = risk_predictor.project_risk_timeline(hotspot_data, twin_result)

    # 10. Register detection in persistence tracker
    persistence_tracker.register_detection(data.lat, data.lon, data.frp)

    inference_latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "success": True,
        "classification": prediction_label,
        "confidence": round(top_confidence, 4),
        "risk_score": risk_score,
        "is_industrial": prediction_label in ["INDUSTRIAL_ACCIDENTAL_FIRE", "INDUSTRIAL_PERSISTENT"],
        "is_persistent": is_persistent,
        "probabilities": prob_dict,
        "nearest_facility": metadata["nearest_facility"],
        "land_cover_distances": metadata["land_cover_distances"],
        "persistence": metadata["persistence"],
        "thermal_twin": twin_result,
        "indicators": indicators,
        "shap_explanation": shap_explanation,
        "prediction": prediction_timeline,
        "recommended_action": recommendations,
        "features": {name: val for name, val in zip(used_feature_names, feature_arr[0].tolist())},
        "telemetry": {
            "satellite": data.satellite or "VIIRS",
            "brightness_kelvin": data.brightness,
            "frp_mw": data.frp,
            "daynight": metadata["daynight"],
            "acq_date": data.acq_date,
            "inference_latency_ms": inference_latency_ms,
        },
    }


@app.post("/predict-batch", tags=["prediction"])
def predict_batch(batch: BatchAnomalyInput):
    """Batch inference endpoint for high-volume satellite swath ingestion."""
    start_time = time.time()
    results = []

    for item in batch.anomalies:
        try:
            res = predict_anomaly(item)
            results.append(res)
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e),
                "lat": item.lat,
                "lon": item.lon,
            })

    total_time_ms = round((time.time() - start_time) * 1000, 2)
    return {
        "success": True,
        "total_processed": len(batch.anomalies),
        "elapsed_ms": total_time_ms,
        "results": results,
    }


# ── Facility Digital Twin Endpoints ───────────────────────────────────────────

@app.get("/twin/{facility_id}", tags=["digital-twin"])
def get_facility_twin(facility_id: str):
    """
    Returns the Facility Digital Twin profile for the given facility ID.
    Includes hourly FRP means/stds for the baseline chart and summary stats.
    """
    twin = get_or_create_twin(facility_id)
    hourly_means = twin.get_all_hourly_means(facility_id)
    hourly_stds = [
        round(twin.std_frp_by_hour.get(h, twin.overall_std), 2)
        for h in range(24)
    ]

    return {
        "success": True,
        "facility_id": facility_id,
        "baseline": {
            "hourly_means": hourly_means,
            "hourly_stds": hourly_stds,
            "overall_mean": round(twin.overall_mean, 2),
            "overall_std": round(twin.overall_std, 2),
            "sample_count": twin.sample_count,
            "daily_frequency": round(twin.daily_frequency, 2),
        },
    }


@app.post("/twin/anomaly", tags=["digital-twin"])
def check_twin_anomaly(data: AnomalyInput):
    """
    Checks whether a given hotspot's FRP is anomalous for its nearest facility's
    learned thermal baseline at the current hour.
    Returns z-score, anomaly ratio, severity, and alert message.
    """
    nearest_fac, _ = find_nearest_industrial_facility(data.lat, data.lon)
    facility_id = nearest_fac["id"]

    current_hour = 12
    if data.acq_time:
        try:
            current_hour = int(str(data.acq_time).zfill(4)[:2])
        except ValueError:
            current_hour = 12

    result = detect_facility_anomaly(facility_id, data.frp, current_hour)
    return {
        "success": True,
        "facility_id": facility_id,
        "facility_name": nearest_fac["name"],
        "anomaly": result,
    }


# ── Predictive Risk Timeline Endpoints ────────────────────────────────────────

@app.post("/predict/timeline", tags=["prediction"])
def predict_risk_timeline(data: AnomalyInput):
    """
    Projects future risk at 30, 60, and 120 minutes from now based on the
    current thermal state and the facility's digital twin baseline.
    Returns trend classification and an escalation alert if warranted.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Classification model is not loaded")

    features, metadata = extract_features(
        lat=data.lat,
        lon=data.lon,
        brightness=data.brightness,
        frp=data.frp,
        confidence=data.confidence,
        daynight=data.daynight or "N",
        persistence_score=data.persistence_score,
    )

    facility_id = metadata["nearest_facility"]["id"]
    current_hour = 12
    if data.acq_time:
        try:
            current_hour = int(str(data.acq_time).zfill(4)[:2])
        except ValueError:
            current_hour = 12

    twin_result = detect_facility_anomaly(facility_id, data.frp, current_hour)

    feature_arr = np.array([features])
    try:
        prediction_label = pipeline.predict(feature_arr)[0]
        probabilities = pipeline.predict_proba(feature_arr)[0]
        top_confidence = float(max(probabilities))
    except Exception:
        prediction_label = "WILDFIRE"
        top_confidence = 0.7

    pers = metadata["persistence"]
    dist_ind = metadata["nearest_facility"]["distance_km"]
    is_night = metadata["daynight"] == "Night"

    hotspot_data = {
        "frp": data.frp,
        "brightness": data.brightness,
        "classification": prediction_label,
        "confidence": top_confidence,
        "dist_to_industrial": dist_ind,
        "persistence_score": pers.get("persistence_score", 0.1),
        "is_night": is_night,
        "thermal_anomaly_z_score": twin_result.get("z_score", 0.0),
        "anomaly_ratio": twin_result.get("anomaly_ratio", 1.0),
    }

    timeline = risk_predictor.project_risk_timeline(hotspot_data, twin_result)

    return {
        "success": True,
        "facility_id": facility_id,
        "facility_name": metadata["nearest_facility"]["name"],
        "thermal_twin": twin_result,
        "timeline": timeline,
    }


@app.post("/predict/whatif", tags=["prediction"])
def predict_whatif(data: WhatIfInput):
    """
    What-If risk simulator for dashboard sliders.
    Given FRP growth rate, persistence, population exposure, and facility distance,
    returns a 30/60/120-minute risk projection.
    """
    timeline = risk_predictor.run_whatif(
        base_frp=data.base_frp,
        growth_rate_pct=data.growth_rate_pct,
        persistence_score=data.persistence_score,
        population_thousands=data.population_thousands,
        distance_km=data.distance_km,
        facility_type=data.facility_type or "chemical",
    )
    return {
        "success": True,
        "input": data.model_dump(),
        "timeline": timeline,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
