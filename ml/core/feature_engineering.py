"""
Feature Engineering Pipeline.
Transforms raw NASA FIRMS (VIIRS/MODIS) satellite detections and OSM/LULC GIS spatial features
into normalized numerical feature vectors for Machine Learning inference.
"""

from typing import Any, Dict, List, Tuple
from ml.core.geo_catalog import (
    find_nearest_industrial_facility,
    calculate_industrial_density,
    estimate_land_cover_distances,
)
from ml.core.persistence import PersistenceTracker

# Global singleton persistence tracker
_persistence_tracker = PersistenceTracker()

FEATURE_NAMES = [
    "brightness_kelvin",
    "frp_mw",
    "day_night_encoded",
    "confidence_normalized",
    "dist_to_industrial_km",
    "dist_to_forest_km",
    "dist_to_farmland_km",
    "industrial_density_10km",
    "persistence_score",
    "frp_to_persistence_ratio",
    "thermal_anomaly_z_score",
    "anomaly_ratio",
]


def extract_features(
    lat: float,
    lon: float,
    brightness: float,
    frp: float,
    confidence: Any,
    daynight: str = "N",
    persistence_score: float = None,
) -> Tuple[List[float], Dict[str, Any]]:
    """
    Extracts structured feature vector and detailed contextual metadata
    for a given thermal anomaly.
    """
    # 1. Normalize Day/Night
    day_night_str = str(daynight).upper().strip()
    is_night = 1.0 if day_night_str in ["N", "NIGHT"] else 0.0

    # 2. Normalize Confidence
    conf_norm = 0.5
    if isinstance(confidence, (int, float)):
        conf_norm = max(0.0, min(1.0, float(confidence) / 100.0))
    elif isinstance(confidence, str):
        c_lower = confidence.lower().strip()
        if c_lower in ["h", "high"]:
            conf_norm = 0.95
        elif c_lower in ["n", "nominal"]:
            conf_norm = 0.70
        elif c_lower in ["l", "low"]:
            conf_norm = 0.35

    # 3. Geospatial Infrastructure & Land Cover Proximity
    land_cover_info = estimate_land_cover_distances(lat, lon)
    dist_ind = land_cover_info["dist_to_industrial_km"]
    dist_forest = land_cover_info["dist_to_forest_km"]
    dist_farm = land_cover_info["dist_to_farmland_km"]
    ind_density = float(calculate_industrial_density(lat, lon, radius_km=10.0))

    # 4. Spatio-Temporal Persistence Analysis
    if persistence_score is not None:
        p_score = float(persistence_score)
        pers_eval = {
            "persistence_score": p_score,
            "historical_detections": 10 if p_score > 0.5 else 1,
            "mean_historical_frp": frp,
            "frp_surge_ratio": 1.0,
            "is_persistent": p_score >= 0.60,
            "is_anomalous_surge": False,
        }
    else:
        pers_eval = _persistence_tracker.evaluate_persistence(lat, lon, frp)
        p_score = pers_eval["persistence_score"]

    # 5. Facility Digital Twin Anomaly Evaluation
    from ml.core.thermal_twin import detect_facility_anomaly
    twin_fac_id = land_cover_info["nearest_facility_id"]
    # Estimate approximate hour from day/night if acq_time isn't supplied
    hour_est = 22 if is_night == 1.0 else 14
    twin_eval = detect_facility_anomaly(twin_fac_id, frp, hour_est)
    z_score = float(twin_eval.get("z_score", 0.0))
    anomaly_ratio = float(twin_eval.get("anomaly_ratio", 1.0))

    feature_vector = [
        float(brightness),
        float(frp),
        float(is_night),
        float(conf_norm),
        float(dist_ind),
        float(dist_forest),
        float(dist_farm),
        float(ind_density),
        float(p_score),
        float(frp_ratio),
        z_score,
        anomaly_ratio,
    ]

    metadata = {
        "lat": lat,
        "lon": lon,
        "brightness": brightness,
        "frp": frp,
        "daynight": "Night" if is_night == 1.0 else "Day",
        "confidence_score": round(conf_norm * 100, 1),
        "nearest_facility": {
            "id": land_cover_info["nearest_facility_id"],
            "name": land_cover_info["nearest_facility_name"],
            "type": land_cover_info["nearest_facility_type"],
            "distance_km": dist_ind,
        },
        "land_cover_distances": {
            "industrial_km": dist_ind,
            "forest_km": dist_forest,
            "farmland_km": dist_farm,
        },
        "persistence": pers_eval,
        "thermal_twin": twin_eval,
        "industrial_density_10km": int(ind_density),
    }

    return feature_vector, metadata

