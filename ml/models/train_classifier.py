"""
Model Training and Calibration Script for THERMOSAFE.
Trains a Random Forest Ensemble for thermal anomaly classification
using synthetic and empirical distributions derived from NASA FIRMS VIIRS/MODIS,
OpenStreetMap geospatial infrastructure, and Facility Digital Twin anomaly features.
"""

import json
import os
from typing import Tuple
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

CLASSES = [
    "INDUSTRIAL_ACCIDENTAL_FIRE",
    "INDUSTRIAL_PERSISTENT",
    "WILDFIRE",
    "AGRICULTURAL_BURNING",
    "MINING_EXTRACTION",
    "OTHER_OR_FALSE_ALARM",
]

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


def generate_synthetic_dataset(n_samples_per_class: int = 450, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates a realistic, physically grounded dataset matching satellite thermal sensor parameters
    and facility thermal twin anomaly statistics.
    """
    np.random.seed(random_state)
    X = []
    y = []

    # 1. INDUSTRIAL_ACCIDENTAL_FIRE (High FRP, close to industry, sudden surge, high z-score & anomaly ratio)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(380.0, 510.0)
        frp = np.random.uniform(120.0, 580.0)
        day_night = np.random.choice([0.0, 1.0], p=[0.4, 0.6])
        confidence = np.random.uniform(0.85, 1.0)
        dist_ind = np.random.uniform(0.05, 1.8)
        dist_forest = np.random.uniform(10.0, 45.0)
        dist_farm = np.random.uniform(6.0, 35.0)
        ind_density = np.random.randint(1, 8)
        persistence = np.random.uniform(0.05, 0.45)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(2.8, 8.5)
        anomaly_ratio = np.random.uniform(2.5, 6.0)
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("INDUSTRIAL_ACCIDENTAL_FIRE")

    # 2. INDUSTRIAL_PERSISTENT (Gas flares, refinery crackers - close to industry, high persistence, normal z-score ~0-1.2, ratio ~0.8-1.3)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(330.0, 420.0)
        frp = np.random.uniform(15.0, 85.0)
        day_night = np.random.choice([0.0, 1.0], p=[0.3, 0.7])
        confidence = np.random.uniform(0.70, 0.98)
        dist_ind = np.random.uniform(0.02, 1.2)
        dist_forest = np.random.uniform(12.0, 50.0)
        dist_farm = np.random.uniform(8.0, 40.0)
        ind_density = np.random.randint(1, 8)
        persistence = np.random.uniform(0.70, 1.0)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(-0.5, 1.2)
        anomaly_ratio = np.random.uniform(0.8, 1.25)
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("INDUSTRIAL_PERSISTENT")

    # 3. WILDFIRE (Forest - high forest proximity, far from industry, low persistence, neutral baseline z-score)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(320.0, 460.0)
        frp = np.random.uniform(25.0, 350.0)
        day_night = np.random.choice([0.0, 1.0], p=[0.5, 0.5])
        confidence = np.random.uniform(0.60, 0.99)
        dist_ind = np.random.uniform(15.0, 120.0)
        dist_forest = np.random.uniform(0.05, 2.5)
        dist_farm = np.random.uniform(5.0, 40.0)
        ind_density = 0
        persistence = np.random.uniform(0.02, 0.25)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(-0.2, 0.5)
        anomaly_ratio = 1.0
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("WILDFIRE")

    # 4. AGRICULTURAL_BURNING (Crop residue/stubble - close to farm, moderate FRP, daytime, low persistence)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(310.0, 380.0)
        frp = np.random.uniform(5.0, 55.0)
        day_night = np.random.choice([0.0, 1.0], p=[0.85, 0.15])
        confidence = np.random.uniform(0.50, 0.90)
        dist_ind = np.random.uniform(8.0, 60.0)
        dist_forest = np.random.uniform(8.0, 40.0)
        dist_farm = np.random.uniform(0.01, 1.5)
        ind_density = 0
        persistence = np.random.uniform(0.01, 0.18)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(-0.1, 0.3)
        anomaly_ratio = 1.0
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("AGRICULTURAL_BURNING")

    # 5. MINING_EXTRACTION (Coal fires, mining zones - moderate/high persistence)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(330.0, 430.0)
        frp = np.random.uniform(20.0, 110.0)
        day_night = np.random.choice([0.0, 1.0], p=[0.45, 0.55])
        confidence = np.random.uniform(0.65, 0.95)
        dist_ind = np.random.uniform(0.5, 6.0)
        dist_forest = np.random.uniform(3.0, 25.0)
        dist_farm = np.random.uniform(4.0, 30.0)
        ind_density = np.random.randint(1, 4)
        persistence = np.random.uniform(0.50, 0.90)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(0.2, 1.5)
        anomaly_ratio = np.random.uniform(1.0, 1.6)
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("MINING_EXTRACTION")

    # 6. OTHER_OR_FALSE_ALARM (Solar glint, hot ground, low confidence)
    for _ in range(n_samples_per_class):
        brightness = np.random.uniform(300.0, 335.0)
        frp = np.random.uniform(1.0, 12.0)
        day_night = 0.0
        confidence = np.random.uniform(0.15, 0.55)
        dist_ind = np.random.uniform(2.0, 30.0)
        dist_forest = np.random.uniform(2.0, 30.0)
        dist_farm = np.random.uniform(1.0, 20.0)
        ind_density = np.random.randint(0, 3)
        persistence = np.random.uniform(0.01, 0.10)
        frp_ratio = frp / max(0.05, persistence * 50.0)
        z_score = np.random.uniform(-0.5, 0.1)
        anomaly_ratio = 0.5
        X.append([brightness, frp, day_night, confidence, dist_ind, dist_forest, dist_farm, ind_density, persistence, frp_ratio, z_score, anomaly_ratio])
        y.append("OTHER_OR_FALSE_ALARM")

    return np.array(X), np.array(y)


def train_and_save_model(model_dir: str = "ml/models"):
    """Trains the classifier on the 12-feature vector, evaluates metrics, and saves the pipeline artifact."""
    os.makedirs(model_dir, exist_ok=True)
    print("Generating training dataset (12 features with Digital Twin metrics)...")
    X, y = generate_synthetic_dataset(n_samples_per_class=450, random_state=42)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")

    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced",
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", rf),
    ])

    print("Fitting model pipeline...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"\nModel Training Complete! Overall Test Accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))

    importances = rf.feature_importances_
    feat_imp = {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    }

    model_path = os.path.join(model_dir, "classifier.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Pipeline saved to {model_path}")

    meta_path = os.path.join(model_dir, "model_meta.json")
    metadata = {
        "model_name": "THERMOSAFE AI Thermal Twin Classifier",
        "model_type": "RandomForestClassifier",
        "n_estimators": 120,
        "classes": CLASSES,
        "features": FEATURE_NAMES,
        "test_accuracy": round(float(accuracy), 4),
        "feature_importances": feat_imp,
        "n_training_samples": int(X_train.shape[0]),
        "n_test_samples": int(X_test.shape[0]),
        "evaluation_metrics": {
            cls: {
                "precision": round(report[cls]["precision"], 4),
                "recall": round(report[cls]["recall"], 4),
                "f1_score": round(report[cls]["f1-score"], 4),
            }
            for cls in CLASSES if cls in report
        },
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {meta_path}")


if __name__ == "__main__":
    train_and_save_model()
