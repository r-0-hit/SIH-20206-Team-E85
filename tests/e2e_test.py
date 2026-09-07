"""
End-to-End System Integration Test Suite.
Validates the entire workflow from Client -> Backend Gateway -> ML Service -> Database -> Analytics.
"""

import sys
import time
import requests

def test_full_system():
    print("===============================================================")
    print("      PYROGUARD AI - END-TO-END SYSTEM INTEGRATION TEST        ")
    print("===============================================================\n")

    # 1. Test ML Service Health
    print("[1/9] Checking Python FastAPI ML Microservice (Port 8000)...")
    ml_res = requests.get("http://127.0.0.1:8000/health", timeout=5)
    assert ml_res.status_code == 200, f"ML health failed: {ml_res.status_code}"
    ml_data = ml_res.json()
    assert ml_data["status"] == "healthy"
    assert ml_data["model_loaded"] is True
    print(f"  [PASS] ML Service is HEALTHY! Facilities cataloged: {ml_data['facilities_cataloged']}")

    # 2. Test ML Model Info
    print("[2/9] Fetching ML Model Metrics & Calibration...")
    info_res = requests.get("http://127.0.0.1:8000/model-info", timeout=5)
    assert info_res.status_code == 200
    info_data = info_res.json()
    assert info_data["success"] is True
    print(f"  [PASS] Model: {info_data['metadata']['model_name']}, Test Accuracy: {info_data['metadata']['test_accuracy'] * 100:.2f}%")

    # 3. Test Backend API Gateway Health
    print("[3/9] Checking Backend REST API Gateway (Port 5000)...")
    be_res = requests.get("http://127.0.0.1:5000/api/health", timeout=5)
    assert be_res.status_code == 200, f"Backend health failed: {be_res.status_code}"
    print(f"  [PASS] Backend Gateway is ONLINE: {be_res.json()['service']}")

    # 4. Test Swagger UI Documentation
    print("[4/9] Checking Swagger OpenAPI Documentation (/api/docs)...")
    doc_res = requests.get("http://127.0.0.1:5000/api/docs/", timeout=5)
    assert doc_res.status_code == 200
    print("  [PASS] Swagger UI documentation is LIVE and accessible at /api/docs")

    # 5. Test Authentication Workflow (Login with Admin credentials)
    print("[5/9] Testing Authentication & JWT Generation...")
    login_payload = {
        "email": "admin@pyroguard.ai",
        "password": "Admin@12345"
    }
    auth_res = requests.post("http://127.0.0.1:5000/api/auth/login", json=login_payload, timeout=5)
    assert auth_res.status_code == 200, f"Login failed: {auth_res.text}"
    auth_data = auth_res.json()
    assert auth_data["success"] is True
    token = auth_data["data"]["token"]
    user = auth_data["data"]["user"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] Authenticated as {user['fullName']} ({user['role']})")
    print(f"  [PASS] JWT Token successfully validated (length: {len(token)} chars)")

    # 6. Test Core AI Analysis Workflow (Submit refinery emergency fire anomaly)
    print("[6/9] Testing Real-Time Thermal Anomaly Submission & AI Classification...")
    analysis_payload = {
        "lat": 22.3619,
        "lon": 69.8318,
        "brightness": 478.5,
        "frp": 395.0,
        "satellite": "VIIRS-SNPP",
        "daynight": "N",
        "confidence": "high"
    }
    submit_res = requests.post("http://127.0.0.1:5000/api/detections/analyze", json=analysis_payload, headers=headers, timeout=10)
    assert submit_res.status_code == 201, f"Analysis failed: {submit_res.text}"
    det = submit_res.json()["data"]
    assert det["classification"] == "INDUSTRIAL_ACCIDENTAL_FIRE"
    assert det["risk_score"] >= 80
    assert det["is_industrial"] is True
    assert len(det["indicators"]) >= 3
    assert len(det["recommended_action"]) >= 3
    print(f"  [PASS] Anomaly Classified: {det['classification']}")
    print(f"  [PASS] Risk Score: {det['risk_score']}/100 | Nearest: {det['nearest_facility']['name']} ({det['nearest_facility']['distance_km']} km)")
    print(f"  [PASS] Explainable Indicator Sample: '{det['indicators'][0]}'")
    print(f"  [PASS] Emergency SOP Sample: '{det['recommended_action'][0]}'")

    # 7. Test Database Reads & Filtering (Query Detection Registry)
    print("[7/9] Testing Database Reads & Filtering (/api/detections)...")
    get_res = requests.get("http://127.0.0.1:5000/api/detections?riskLevel=CRITICAL", timeout=5)
    assert get_res.status_code == 200
    reg_data = get_res.json()["data"]
    assert reg_data["total"] >= 1
    print(f"  [PASS] Successfully retrieved {reg_data['total']} critical thermal records from SQLite database")

    # 8. Test Platform Analytics Aggregation
    print("[8/9] Testing Analytics Module (/api/analytics/summary)...")
    analytics_res = requests.get("http://127.0.0.1:5000/api/analytics/summary", timeout=5)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()["data"]
    summary = analytics_data["summary"]
    assert summary["totalAnalyses"] >= 1
    assert summary["industrialAccidents"] >= 1
    print(f"  [PASS] Aggregated Summary: {summary['totalAnalyses']} Total Monitored, {summary['industrialAccidents']} Industrial Accidents, {summary['industrialPersistent']} Persistent Flares")

    # 9. Test Frontend Web Console Availability
    print("[9/9] Testing Frontend Web Console (Port 3000)...")
    fe_res = requests.get("http://localhost:3000", timeout=5)
    assert fe_res.status_code == 200
    assert "PyroGuard" in fe_res.text or "<div id=\"root\">" in fe_res.text
    print("  [PASS] Frontend Web Application is LIVE and serving index.html at http://localhost:3000")

    print("\n===============================================================")
    print("       ALL 9 END-TO-END INTEGRATION TESTS PASSED!              ")
    print("===============================================================\n")

if __name__ == "__main__":
    try:
        test_full_system()
    except Exception as e:
        print(f"\n[FAIL] Integration test failed: {e}")
        sys.exit(1)
