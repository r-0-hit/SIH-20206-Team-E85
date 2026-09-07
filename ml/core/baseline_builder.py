"""
Utility module for building facility baselines from synthetic history or real CSV data.
"""

import os
import random
import csv
from typing import List, Dict, Any

from thermal_twin import FacilityThermalTwin, BASELINE_DIR

def build_baselines_from_synthetic_history() -> None:
    """Generate realistic historical observation dicts for pre-seeded facilities and build baselines."""
    
    # IND-REF-001 (Jamnagar Refinery): night-heavy operation, high FRP 18:00-06:00
    # IND-REF-002 (Panipat Refinery): continuous operation, moderate FRP all hours
    # IND-STL-001 (Tata Steel Jamshedpur): 24/7 high FRP
    # IND-MIN-001 (Jharia Coal): consistently elevated FRP all day
    # IND-PWR-001 (Mundra Thermal Power): stable moderate FRP 24/7
    # IND-FLR-001 (Mumbai High Offshore): high FRP with nighttime peak
    
    configs = {
        'IND-REF-001': {'base': 50, 'night_boost': 60},
        'IND-REF-002': {'base': 40, 'night_boost': 0},
        'IND-STL-001': {'base': 100, 'night_boost': 20},
        'IND-MIN-001': {'base': 80, 'night_boost': 0},
        'IND-PWR-001': {'base': 45, 'night_boost': 5},
        'IND-FLR-001': {'base': 70, 'night_boost': 40},
    }
    
    os.makedirs(BASELINE_DIR, exist_ok=True)
    
    for fac_id, config in configs.items():
        observations = []
        for day in range(30):
            for h in range(24):
                base = config['base']
                if h >= 18 or h < 6:
                    base += config['night_boost']
                    
                # Add random variation
                frp = base + random.uniform(-10.0, 10.0)
                if frp < 0:
                    frp = 0
                
                observations.append({
                    'frp': frp,
                    'hour_of_day': h
                })
                
        twin = FacilityThermalTwin(fac_id)
        twin.build_baseline(fac_id, observations)
        twin.save_baseline(fac_id)
        print(f"Built and saved synthetic baseline for {fac_id}")

def build_baseline_from_csv(csv_path: str, facility_lat: float, facility_lon: float, facility_id: str) -> None:
    """
    Read FIRMS CSV and build baseline for a single facility from real data.
    """
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return
        
    observations = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                frp = float(row['frp'])
                acq_time = row['acq_time'].zfill(4)
                hour = int(acq_time[:2])
                
                observations.append({
                    'frp': frp,
                    'hour_of_day': hour
                })
            except Exception as e:
                continue
                
    if observations:
        twin = FacilityThermalTwin(facility_id)
        twin.build_baseline(facility_id, observations)
        twin.save_baseline(facility_id)
        print(f"Built and saved baseline from CSV for {facility_id}")
    else:
        print(f"No valid observations found in {csv_path} for {facility_id}")

if __name__ == '__main__':
    build_baselines_from_synthetic_history()
