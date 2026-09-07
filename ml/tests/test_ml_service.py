"""
Unit and Integration Tests for ML Inference Service.
Tests classification precision, explainability generation, and error handling.
"""

from fastapi.testclient import TestClient
from ml.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["facilities_cataloged"] > 0


def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    meta = data["metadata"]
    assert "classes" in meta
    assert "features" in meta
    assert meta["test_accuracy"] > 0.90


def test_industrial_accidental_fire_prediction():
    # Simulated massive explosion/fire at Jamnagar Refinery (FRP=380MW, Brightness=460K, inside facility buffer)
    payload = {
        "lat": 22.3619,
        "lon": 69.8318,
        "brightness": 460.0,
        "frp": 380.0,
        "daynight": "N",
        "confidence": "high",
        "satellite": "VIIRS",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["classification"] == "INDUSTRIAL_ACCIDENTAL_FIRE"
    assert res["risk_score"] >= 80
    assert res["is_industrial"] is True
    assert len(res["indicators"]) >= 3
    assert len(res["recommended_action"]) >= 3
    assert res["nearest_facility"]["name"] == "Reliance Jamnagar Refinery Complex"


def test_industrial_persistent_flare_prediction():
    # Routine gas flaring at Panipat Refinery (FRP=42MW, high persistence, inside facility)
    payload = {
        "lat": 29.3941,
        "lon": 76.8833,
        "brightness": 355.0,
        "frp": 42.0,
        "daynight": "N",
        "confidence": "nominal",
        "persistence_score": 0.85,
        "satellite": "VIIRS",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["classification"] == "INDUSTRIAL_PERSISTENT"
    assert res["is_persistent"] is True
    assert res["risk_score"] <= 70


def test_wildfire_prediction():
    # Remote forest fire in Simlipal National Park (FRP=85MW, far from industry, in forest)
    payload = {
        "lat": 21.75,
        "lon": 86.33,
        "brightness": 370.0,
        "frp": 85.0,
        "daynight": "D",
        "confidence": "high",
        "satellite": "VIIRS",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["classification"] == "WILDFIRE"
    assert res["is_industrial"] is False


def test_batch_prediction():
    batch = {
        "anomalies": [
            {"lat": 22.3619, "lon": 69.8318, "brightness": 440.0, "frp": 290.0, "daynight": "N"},
            {"lat": 21.75, "lon": 86.33, "brightness": 360.0, "frp": 70.0, "daynight": "D"},
        ]
    }
    response = client.post("/predict-batch", json=batch)
    assert response.status_code == 200
    res = response.json()
    assert res["total_processed"] == 2
    assert len(res["results"]) == 2


def test_invalid_coordinates():
    # Latitude out of range
    payload = {
        "lat": 95.0,
        "lon": 70.0,
        "brightness": 350.0,
        "frp": 50.0,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

