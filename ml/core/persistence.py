"""
Spatio-Temporal Persistence Analysis Engine.
Differentiates between stationary, recurrent industrial thermal sources
(gas flares, furnace exhausts) and transient events (wildfires, stubble burning, accidental explosions).
"""

from typing import Dict, List, Optional, Tuple
from ml.core.geo_catalog import haversine_distance_km, find_nearest_industrial_facility


class PersistenceTracker:
    """
    Maintains a spatial memory of historical thermal anomaly detections
    to evaluate spatio-temporal persistence and detect anomalous thermal surges.
    """

    def __init__(self, cluster_radius_km: float = 1.0):
        self.cluster_radius_km = cluster_radius_km
        # In-memory registry of historical thermal clusters:
        # id -> { "center_lat": ..., "center_lon": ..., "count": ..., "mean_frp": ..., "max_frp": ..., "first_seen": ..., "last_seen": ... }
        self.clusters: List[Dict] = []
        self._initialize_baseline_clusters()

    def _initialize_baseline_clusters(self):
        """Pre-seeds known persistent industrial thermal clusters (refineries, flares, smelters)."""
        baseline_sources = [
            {"lat": 22.3619, "lon": 69.8318, "count": 142, "mean_frp": 45.3, "max_frp": 95.0, "label": "Jamnagar Flare"},
            {"lat": 29.3941, "lon": 76.8833, "count": 118, "mean_frp": 38.2, "max_frp": 78.0, "label": "Panipat Flare"},
            {"lat": 19.0062, "lon": 72.8953, "count": 89, "mean_frp": 32.5, "max_frp": 62.0, "label": "Mahul Refinery Thermal"},
            {"lat": 19.4167, "lon": 71.3333, "count": 210, "mean_frp": 58.4, "max_frp": 112.0, "label": "Mumbai High Flare"},
            {"lat": 23.7431, "lon": 86.4175, "count": 165, "mean_frp": 42.1, "max_frp": 85.0, "label": "Jharia Underground Coal Fire"},
            {"lat": 22.7925, "lon": 86.1950, "count": 130, "mean_frp": 50.8, "max_frp": 92.0, "label": "Tata Steel Furnace Exhaust"},
            {"lat": 22.2133, "lon": 84.8633, "count": 95, "mean_frp": 41.6, "max_frp": 81.0, "label": "Rourkela Blast Furnace"},
            {"lat": 26.6500, "lon": 50.1500, "count": 280, "mean_frp": 72.0, "max_frp": 140.0, "label": "Ras Tanura Flaring"},
            {"lat": 1.2667, "lon": 103.7000, "count": 175, "mean_frp": 48.0, "max_frp": 90.0, "label": "Jurong Island Flaring"},
        ]

        for s in baseline_sources:
            self.clusters.append({
                "lat": s["lat"],
                "lon": s["lon"],
                "detection_count": s["count"],
                "mean_frp": s["mean_frp"],
                "max_frp": s["max_frp"],
                "persistence_score": min(1.0, s["count"] / 100.0),
                "label": s["label"],
            })

    def evaluate_persistence(self, lat: float, lon: float, current_frp: float) -> Dict:
        """
        Evaluates the spatio-temporal persistence index of a thermal anomaly
        and checks whether the current FRP represents an anomalous surge.
        """
        matched_cluster = None
        min_distance = float("inf")

        for c in self.clusters:
            dist = haversine_distance_km(lat, lon, c["lat"], c["lon"])
            if dist < self.cluster_radius_km and dist < min_distance:
                min_distance = dist
                matched_cluster = c

        if matched_cluster:
            persistence_score = matched_cluster["persistence_score"]
            detection_count = matched_cluster["detection_count"]
            mean_frp = matched_cluster["mean_frp"]
            frp_surge_ratio = current_frp / max(1.0, mean_frp)
            is_anomalous_surge = frp_surge_ratio >= 2.5 and current_frp > 120.0
            is_persistent = persistence_score >= 0.60

            return {
                "persistence_score": round(persistence_score, 3),
                "historical_detections": detection_count,
                "cluster_distance_km": round(min_distance, 3),
                "mean_historical_frp": round(mean_frp, 1),
                "frp_surge_ratio": round(frp_surge_ratio, 2),
                "is_persistent": is_persistent,
                "is_anomalous_surge": is_anomalous_surge,
                "cluster_label": matched_cluster["label"],
            }
        else:
            # Check proximity to known industrial facility
            nearest_fac, dist_km = find_nearest_industrial_facility(lat, lon)
            if dist_km <= 2.0 and nearest_fac.get("operational_flaring"):
                # Proximity implies possible unrecorded persistent industrial site
                estimated_persistence = max(0.4, 0.8 - (dist_km * 0.2))
            else:
                estimated_persistence = 0.05

            return {
                "persistence_score": round(estimated_persistence, 3),
                "historical_detections": 1,
                "cluster_distance_km": None,
                "mean_historical_frp": round(current_frp, 1),
                "frp_surge_ratio": 1.0,
                "is_persistent": estimated_persistence >= 0.60,
                "is_anomalous_surge": current_frp > 150.0 and dist_km <= 3.0,
                "cluster_label": None,
            }

    def register_detection(self, lat: float, lon: float, frp: float):
        """Updates internal cluster counts upon new detection."""
        for c in self.clusters:
            dist = haversine_distance_km(lat, lon, c["lat"], c["lon"])
            if dist <= self.cluster_radius_km:
                c["detection_count"] += 1
                c["persistence_score"] = min(1.0, c["detection_count"] / 100.0)
                c["max_frp"] = max(c["max_frp"], frp)
                return c

        self.clusters.append({
            "lat": lat,
            "lon": lon,
            "detection_count": 1,
            "mean_frp": frp,
            "max_frp": frp,
            "persistence_score": 0.05,
            "label": "New Thermal Observation",
        })

