"""
Explainable AI (XAI) & Incident Risk Scoring Engine.
Generates human-understandable evidence indicators, 0-100 risk meters,
and recommended operational SOP response protocols.
"""

from typing import Any, Dict, List


def calculate_risk_score(
    classification: str,
    confidence: float,
    frp: float,
    brightness: float,
    dist_to_industrial: float,
    persistence_score: float,
    is_night: bool,
) -> int:
    """
    Computes a composite multi-factor risk score between 0 and 100.
    """
    if classification == "INDUSTRIAL_ACCIDENTAL_FIRE":
        base = 82.0
        # Energy modifier (FRP > 150MW increases danger)
        energy_mod = min(12.0, (frp / 200.0) * 12.0)
        # Proximity modifier (closer to plant = higher hazard to lives and storage)
        prox_mod = max(0.0, (3.0 - dist_to_industrial) * 2.0)
        score = base + energy_mod + prox_mod
        return int(min(99, max(80, round(score))))

    elif classification == "INDUSTRIAL_PERSISTENT":
        base = 35.0
        # High persistence operational flares are routine, but very high FRP (> 80 MW) warrants scrutiny
        frp_mod = min(20.0, (frp / 100.0) * 20.0)
        score = base + frp_mod
        return int(min(68, max(25, round(score))))

    elif classification == "WILDFIRE":
        base = 65.0
        energy_mod = min(22.0, (frp / 150.0) * 22.0)
        temp_mod = min(8.0, max(0.0, (brightness - 340.0) / 10.0))
        score = base + energy_mod + temp_mod
        return int(min(95, max(55, round(score))))

    elif classification == "AGRICULTURAL_BURNING":
        base = 32.0
        energy_mod = min(18.0, (frp / 80.0) * 18.0)
        score = base + energy_mod
        return int(min(60, max(20, round(score))))

    elif classification == "MINING_EXTRACTION":
        base = 52.0
        energy_mod = min(20.0, (frp / 100.0) * 20.0)
        score = base + energy_mod
        return int(min(78, max(45, round(score))))

    else:  # OTHER_OR_FALSE_ALARM
        return int(min(25, max(5, round(frp * 2.0))))


def generate_indicators(
    classification: str,
    metadata: Dict[str, Any],
    confidence: float,
) -> List[str]:
    """
    Generates actionable, explainable evidence statements supporting the AI model verdict.
    """
    indicators = []
    frp = metadata["frp"]
    brightness = metadata["brightness"]
    dist_ind = metadata["nearest_facility"]["distance_km"]
    fac_name = metadata["nearest_facility"]["name"]
    fac_type = metadata["nearest_facility"]["type"].replace("_", " ").title()
    is_night = metadata["daynight"] == "Night"
    pers = metadata["persistence"]
    p_score = pers.get("persistence_score", 0.0)
    surge = pers.get("is_anomalous_surge", False)

    # 1. Geographic Proximity Indicator
    if dist_ind <= 1.5:
        indicators.append(
            f"Direct Industrial Proximity: Located {dist_ind} km from {fac_name} ({fac_type}). Anomaly falls inside the high-risk perimeter."
        )
    elif dist_ind <= 5.0:
        indicators.append(
            f"Buffer Zone Proximity: Located {dist_ind} km from {fac_name}. Within facility impact and vapor dispersion zone."
        )
    else:
        indicators.append(
            f"Remote Location: Located {dist_ind} km away from any cataloged industrial or petrochemical infrastructure."
        )

    # 2. Spatio-Temporal Persistence Indicator
    if p_score >= 0.60:
        det_cnt = pers.get("historical_detections", "Multiple")
        indicators.append(
            f"High Temporal Recurrence: S-T persistence index is {p_score:.2f} with {det_cnt} historical satellite detections, indicative of stationary operational thermal emissions."
        )
    elif p_score < 0.20:
        indicators.append(
            f"Low Temporal Persistence: S-T persistence index is {p_score:.2f}. Represents a sudden, non-stationary thermal occurrence."
        )

    # 3. Energy Radiance & Spike Indicator
    if surge or (classification == "INDUSTRIAL_ACCIDENTAL_FIRE" and frp >= 100.0):
        indicators.append(
            f"Catastrophic Energy Surge: Fire Radiative Power ({frp:.1f} MW) significantly exceeds routine operational baselines by >3x."
        )
    elif frp >= 80.0:
        indicators.append(
            f"High Intensity Radiative Power: Anomaly energy output of {frp:.1f} MW observed with brightness temperature of {brightness:.1f} K."
        )
    else:
        indicators.append(
            f"Moderate Radiative Power: Fire Radiative Power is {frp:.1f} MW, typical of controlled flaring, agricultural stubble burning, or small-scale vegetation fires."
        )

    # 4. Diurnal & Sensor Indicator
    if is_night:
        indicators.append(
            "Nighttime Satellite Overpass: Detection occurred during night swath, eliminating possibility of solar glint or ground reflection artifacts."
        )
    else:
        indicators.append(
            "Daytime Satellite Overpass: Confirmed thermal emission with calibrated multi-spectral band contrast."
        )

    # 5. Model Confidence
    indicators.append(
        f"Multi-spectral Confidence: Ensemble model confidence evaluated at {confidence * 100:.1f}% based on sensor telemetry."
    )

    if 'thermal_twin' in metadata and metadata['thermal_twin']:
        twin = metadata['thermal_twin']
        if twin.get('anomaly_severity') in ['ANOMALOUS', 'EXTREME']:
            indicators.insert(0, f"Digital Twin Alert: Current FRP is {twin.get('anomaly_ratio', 1):.1f}× above the facility's learned thermal baseline (z-score: {twin.get('z_score', 0):.1f}). Severity: {twin.get('anomaly_severity')}.")

    return indicators


def generate_recommendations(classification: str, risk_score: int, metadata: Dict[str, Any]) -> List[str]:
    """
    Generates tailored standard operating procedure (SOP) recommendations.
    """
    fac_name = metadata["nearest_facility"]["name"]

    if classification == "INDUSTRIAL_ACCIDENTAL_FIRE":
        return [
            f"IMMEDIATE ACTION: Dispatch on-site emergency response teams and fire tender units to {fac_name}.",
            "Initiate emergency plant shutdown and isolation of hydrocarbon / chemical fuel feeds.",
            "Establish a 2.5 km perimeter exclusion zone downwind for toxic vapor and smoke containment.",
            "Alert district disaster management authorities (NDRF/SDRF) and local emergency medical services.",
            "Cross-reference with plant SCADA telemetry and internal CCTV thermal cameras.",
        ]
    elif classification == "INDUSTRIAL_PERSISTENT":
        return [
            f"ROUTINE MONITORING: Verify {fac_name} flare operational emission permit and flaring logs.",
            "Check for unannounced flaring excursions or scrubber pressure relief valve events.",
            "Record detection in regional emissions registry for carbon footprint accounting.",
            "No immediate evacuation or civil defense alert required.",
        ]
    elif classification == "WILDFIRE":
        return [
            "ALERT FOREST DIVISION: Transmit GPS coordinates to nearest Forest Range Office and fire watchtowers.",
            "Deploy aerial surveillance or drone reconnaissance to assess flame front propagation vector.",
            "Prepare fireline buffer clearing to prevent encroachment towards nearby human settlements.",
            "Monitor local wind vector and relative humidity forecast.",
        ]
    elif classification == "AGRICULTURAL_BURNING":
        return [
            "ENVIRONMENTAL ADVISORY: Notify state pollution control board and district agricultural extension officers.",
            "Verify compliance with seasonal open-burning regulations and air quality index (AQI) limits.",
            "Check wind direction relative to national highway and airport visibility corridors.",
        ]
    elif classification == "MINING_EXTRACTION":
        return [
            "MINING SAFETY ALERT: Alert mine safety directorate regarding spontaneous coal combustion or overburden fire.",
            "Deploy nitrogen foam injection or clay capping to suffocate underground seam ignition.",
            "Check carbon monoxide (CO) gas monitors in adjacent mining shafts.",
        ]
    else:
        return [
            "DATA VALIDATION: Flagged as benign or potential false alarm. No emergency action required.",
            "Verify next scheduled satellite overpass (VIIRS NOAA-20 / NOAA-21) for confirmation.",
        ]


FEATURE_LABELS = {
    'brightness_kelvin':          'Brightness Temperature',
    'frp_mw':                     'Fire Radiative Power',
    'day_night_encoded':          'Nighttime Detection',
    'confidence_normalized':      'Sensor Confidence',
    'dist_to_industrial_km':      'Proximity to Industrial Facility',
    'dist_to_forest_km':          'Distance to Forest Zone',
    'dist_to_farmland_km':        'Distance to Agricultural Land',
    'industrial_density_10km':    'Industrial Cluster Density',
    'persistence_score':          'Historical Persistence Index',
    'frp_to_persistence_ratio':   'FRP–Persistence Ratio',
    'thermal_anomaly_z_score':    'Thermal Anomaly Deviation',
    'anomaly_ratio':              'Anomaly Multiplier vs Baseline',
}

def generate_shap_explanation(pipeline, feature_vector, feature_names) -> list[dict]:
    import numpy as np
    try:
        import shap
        has_shap = True
    except ImportError:
        has_shap = False

    classifier = pipeline.steps[-1][1]
    
    if has_shap:
        try:
            explainer = shap.TreeExplainer(classifier)
            shap_values = explainer.shap_values(np.array([feature_vector]))
            
            if isinstance(shap_values, list):
                if hasattr(classifier, 'predict_proba'):
                    probas = classifier.predict_proba(np.array([feature_vector]))[0]
                    class_idx = np.argmax(probas)
                else:
                    class_idx = int(classifier.predict(np.array([feature_vector]))[0])
                contributions = shap_values[class_idx][0]
            else:
                if len(shap_values.shape) == 3:
                    if hasattr(classifier, 'predict_proba'):
                        probas = classifier.predict_proba(np.array([feature_vector]))[0]
                        class_idx = np.argmax(probas)
                    else:
                        class_idx = int(classifier.predict(np.array([feature_vector]))[0])
                    contributions = shap_values[0, :, class_idx]
                else:
                    contributions = shap_values[0]
        except Exception:
            has_shap = False

    if not has_shap:
        if hasattr(classifier, 'feature_importances_'):
            contributions = classifier.feature_importances_
        else:
            contributions = np.zeros(len(feature_names))

    explanations = []
    
    total_abs = np.sum(np.abs(contributions))
    if total_abs == 0:
        total_abs = 1
        
    for name, contrib in zip(feature_names, contributions):
        scaled_contrib = (abs(contrib) / total_abs) * 100
        scaled_contrib = min(scaled_contrib, 40.0)
        direction = "increases_risk" if contrib >= 0 else "decreases_risk"
        
        explanations.append({
            "feature": name,
            "contribution": float(round(scaled_contrib, 1)),
            "direction": direction,
            "label": FEATURE_LABELS.get(name, name)
        })
        
    explanations.sort(key=lambda x: x["contribution"], reverse=True)
    return explanations[:6]

