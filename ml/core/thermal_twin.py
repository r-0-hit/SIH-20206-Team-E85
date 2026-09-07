"""
Facility Digital Thermal Twin

This module implements the core logic for building, persisting, and evaluating
digital thermal twins for various industrial facilities.
"""

import json
import os
import math
from typing import List, Dict, Optional, Any

BASELINE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'baselines')

class FacilityThermalTwin:
    def __init__(self, facility_id: str):
        self.facility_id = facility_id
        self.mean_frp_by_hour: Dict[int, float] = {}
        self.std_frp_by_hour: Dict[int, float] = {}
        self.overall_mean: float = 0.0
        self.overall_std: float = 10.0
        self.daily_frequency: float = 0.0
        self.sample_count: int = 0

    def build_baseline(self, facility_id: str, observations: List[Dict[str, Any]]) -> None:
        """
        Build baseline statistics given historical observations.
        observations: List of dicts, each containing 'frp' and 'hour_of_day' keys.
        """
        self.facility_id = facility_id
        
        frp_by_hour: Dict[int, List[float]] = {h: [] for h in range(24)}
        all_frps: List[float] = []
        
        for obs in observations:
            frp = obs.get('frp', 0.0)
            hour = int(obs.get('hour_of_day', 0))
            if 0 <= hour <= 23:
                frp_by_hour[hour].append(frp)
            all_frps.append(frp)
            
        self.sample_count = len(all_frps)
        
        # Hourly stats
        for h in range(24):
            vals = frp_by_hour[h]
            if vals:
                mean_val = sum(vals) / len(vals)
                variance = sum((x - mean_val) ** 2 for x in vals) / len(vals)
                std_val = max(math.sqrt(variance), 10.0)
            else:
                mean_val = 0.0
                std_val = 10.0
            
            self.mean_frp_by_hour[h] = mean_val
            self.std_frp_by_hour[h] = std_val
            
        # Overall stats
        if all_frps:
            self.overall_mean = sum(all_frps) / len(all_frps)
            variance = sum((x - self.overall_mean) ** 2 for x in all_frps) / len(all_frps)
            self.overall_std = max(math.sqrt(variance), 10.0)
            # Assume data covers about 30 days if daily_frequency isn't explicitly known.
            self.daily_frequency = self.sample_count / 30.0
        else:
            self.overall_mean = 0.0
            self.overall_std = 10.0
            self.daily_frequency = 0.0

    def update_observation(self, frp: float, current_hour: int) -> None:
        """
        Dynamically update baseline statistics when a new FIRMS satellite observation arrives.
        Uses incremental running mean & standard deviation update logic.
        """
        if current_hour < 0 or current_hour > 23:
            current_hour = 12

        # Increment sample count
        self.sample_count += 1

        # Hourly running mean update
        old_mean = self.mean_frp_by_hour.get(current_hour, self.overall_mean if self.overall_mean > 0 else 50.0)
        old_std = self.std_frp_by_hour.get(current_hour, 10.0)

        # Learning rate alpha: higher weight for new observations when samples are few
        alpha = max(0.05, 1.0 / min(self.sample_count, 100))
        new_mean = (1 - alpha) * old_mean + alpha * frp

        # Standard deviation running estimate update
        variance = (1 - alpha) * (old_std ** 2) + alpha * ((frp - new_mean) ** 2)
        new_std = max(math.sqrt(variance), 10.0)

        self.mean_frp_by_hour[current_hour] = round(new_mean, 2)
        self.std_frp_by_hour[current_hour] = round(new_std, 2)

        # Overall running stats
        self.overall_mean = round((1 - alpha) * self.overall_mean + alpha * frp, 2) if self.overall_mean > 0 else round(frp, 2)
        self.daily_frequency = round(self.sample_count / 30.0, 2)

        # Persist updated baseline to disk
        try:
            self.save_baseline(self.facility_id)
        except Exception:
            pass

    def detect_anomaly(self, facility_id: str, current_frp: float, current_hour: int) -> Dict[str, Any]:
        """
        Detect if current observation is anomalous relative to facility learned baseline.
        """
        if current_hour in self.mean_frp_by_hour and self.sample_count > 0 and self.mean_frp_by_hour[current_hour] > 0:
            mean = self.mean_frp_by_hour[current_hour]
            std = self.std_frp_by_hour[current_hour]
        else:
            mean = self.overall_mean if self.overall_mean > 0 else 50.0
            std = self.overall_std if self.overall_std > 0 else 10.0
            
        if std < 10.0:
            std = 10.0

        z_score = (current_frp - mean) / std if std > 0 else 0
        anomaly_ratio = current_frp / max(1.0, mean)
        
        if z_score < 1.5:
            severity = 'NORMAL'
        elif z_score < 2.5:
            severity = 'ELEVATED'
        elif z_score < 4.0:
            severity = 'ANOMALOUS'
        else:
            severity = 'EXTREME'
            
        alert_message = None
        if severity != 'NORMAL':
            alert_message = f"🔴 Current hotspot behaviour is {anomaly_ratio:.1f}× above the learned baseline."

        # Model confidence rated by sample volume
        confidence_pct = round(min(1.0, max(0.2, self.sample_count / 50.0)) * 100, 1)
            
        return {
            'z_score': round(z_score, 2),
            'anomaly_ratio': round(anomaly_ratio, 2),
            'expected_frp': round(mean, 2),
            'std_frp': round(std, 2),
            'anomaly_severity': severity,
            'alert_message': alert_message,
            'current_hour': current_hour,
            'sample_count': self.sample_count,
            'confidence_rating_pct': confidence_pct,
            'is_learned_from_history': self.sample_count > 0,
        }
        
    def load_baseline(self, facility_id: str) -> bool:
        """Load baseline from JSON file."""
        filepath = os.path.join(BASELINE_DIR, f"{facility_id}.json")
        if not os.path.exists(filepath):
            return False
            
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                
            self.facility_id = facility_id
            self.mean_frp_by_hour = {int(k): float(v) for k, v in data.get('mean_frp_by_hour', {}).items()}
            self.std_frp_by_hour = {int(k): float(v) for k, v in data.get('std_frp_by_hour', {}).items()}
            self.overall_mean = float(data.get('overall_mean', 0.0))
            self.overall_std = float(data.get('overall_std', 10.0))
            self.daily_frequency = float(data.get('daily_frequency', 0.0))
            self.sample_count = int(data.get('sample_count', 0))
            return True
        except Exception:
            return False
            
    def save_baseline(self, facility_id: str) -> None:
        """Save baseline to JSON file."""
        if not os.path.exists(BASELINE_DIR):
            os.makedirs(BASELINE_DIR, exist_ok=True)
            
        filepath = os.path.join(BASELINE_DIR, f"{facility_id}.json")
        
        data = {
            'facility_id': self.facility_id,
            'mean_frp_by_hour': {k: v for k, v in self.mean_frp_by_hour.items()},
            'std_frp_by_hour': {k: v for k, v in self.std_frp_by_hour.items()},
            'overall_mean': self.overall_mean,
            'overall_std': self.overall_std,
            'daily_frequency': self.daily_frequency,
            'sample_count': self.sample_count
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)

    def get_all_hourly_means(self, facility_id: str) -> List[float]:
        """Return a list of 24 floats representing the mean FRP for hours 0-23."""
        return [self.mean_frp_by_hour.get(h, self.overall_mean) for h in range(24)]


TWIN_REGISTRY: Dict[str, FacilityThermalTwin] = {}

def get_or_create_twin(facility_id: str) -> FacilityThermalTwin:
    """Retrieve existing twin, load from disk, or create a new empty one."""
    if facility_id in TWIN_REGISTRY:
        return TWIN_REGISTRY[facility_id]
        
    twin = FacilityThermalTwin(facility_id)
    twin.load_baseline(facility_id)
    TWIN_REGISTRY[facility_id] = twin
    return twin

def detect_facility_anomaly(facility_id: str, current_frp: float, current_hour: int) -> Dict[str, Any]:
    """Convenience wrapper for anomaly detection."""
    twin = get_or_create_twin(facility_id)
    return twin.detect_anomaly(facility_id, current_frp, current_hour)

def update_facility_baseline(facility_id: str, current_frp: float, current_hour: int) -> Dict[str, Any]:
    """Dynamically update facility baseline with new satellite observation."""
    twin = get_or_create_twin(facility_id)
    twin.update_observation(current_frp, current_hour)
    return twin.detect_anomaly(facility_id, current_frp, current_hour)

