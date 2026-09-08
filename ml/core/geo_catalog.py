"""
Geospatial Industrial Infrastructure and Land Cover Catalog.
Contains reference industrial facilities (refineries, petrochemical complexes, power plants, steel mills, mining zones)
and spatial proximity functions.
"""

import math
from typing import Dict, List, Optional, Tuple

# Reference registry of key industrial facilities known for thermal emissions and hazard risks
INDUSTRIAL_FACILITIES = [
    # Refineries & Petrochemical Complexes
    {
        "id": "IND-REF-001",
        "name": "Reliance Jamnagar Refinery Complex",
        "type": "petroleum_refinery",
        "lat": 22.3619,
        "lon": 69.8318,
        "country": "India",
        "risk_category": "CRITICAL",
        "operational_flaring": True,
        "buffer_km": 5.0,
    },
    {
        "id": "IND-REF-002",
        "name": "IOCL Panipat Refinery & Petrochemical Complex",
        "type": "petroleum_refinery",
        "lat": 29.3941,
        "lon": 76.8833,
        "country": "India",
        "risk_category": "CRITICAL",
        "operational_flaring": True,
        "buffer_km": 4.0,
    },
    {
        "id": "IND-REF-003",
        "name": "BPCL Mumbai Refinery, Mahul",
        "type": "petroleum_refinery",
        "lat": 19.0062,
        "lon": 72.8953,
        "country": "India",
        "risk_category": "CRITICAL",
        "operational_flaring": True,
        "buffer_km": 3.0,
    },
    {
        "id": "IND-REF-004",
        "name": "HPCL Visakhapatnam Refinery",
        "type": "petroleum_refinery",
        "lat": 17.6981,
        "lon": 83.2575,
        "country": "India",
        "risk_category": "CRITICAL",
        "operational_flaring": True,
        "buffer_km": 3.5,
    },
    {
        "id": "IND-REF-005",
        "name": "Jurong Island Petrochemical Cluster",
        "type": "chemical_complex",
        "lat": 1.2667,
        "lon": 103.7000,
        "country": "Singapore",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 4.0,
    },
    {
        "id": "IND-REF-006",
        "name": "Ras Tanura Refinery & Terminal",
        "type": "petroleum_refinery",
        "lat": 26.6500,
        "lon": 50.1500,
        "country": "Saudi Arabia",
        "risk_category": "CRITICAL",
        "operational_flaring": True,
        "buffer_km": 6.0,
    },
    {
        "id": "IND-REF-007",
        "name": "Houston Ship Channel Petrochemical Hub",
        "type": "chemical_complex",
        "lat": 29.7340,
        "lon": -95.2340,
        "country": "USA",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 6.0,
    },
    # Thermal & Gas Power Stations
    {
        "id": "IND-PWR-001",
        "name": "Mundra Thermal Power Station",
        "type": "thermal_power_plant",
        "lat": 22.8256,
        "lon": 69.5292,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": False,
        "buffer_km": 3.0,
    },
    {
        "id": "IND-PWR-002",
        "name": "NTPC Vindhyachal Super Thermal Station",
        "type": "thermal_power_plant",
        "lat": 24.1011,
        "lon": 82.6719,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": False,
        "buffer_km": 3.5,
    },
    {
        "id": "IND-PWR-003",
        "name": "Korba Super Thermal Power Plant",
        "type": "thermal_power_plant",
        "lat": 22.3831,
        "lon": 82.7214,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": False,
        "buffer_km": 3.0,
    },
    # Steel Mills & Metallurgical Smelters
    {
        "id": "IND-STL-001",
        "name": "Tata Steel Works, Jamshedpur",
        "type": "steel_mill",
        "lat": 22.7925,
        "lon": 86.1950,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 4.0,
    },
    {
        "id": "IND-STL-002",
        "name": "SAIL Rourkela Steel Plant",
        "type": "steel_mill",
        "lat": 22.2133,
        "lon": 84.8633,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 3.5,
    },
    {
        "id": "IND-STL-003",
        "name": "JSW Steel Vijayanagar Works, Bellary",
        "type": "steel_mill",
        "lat": 15.1786,
        "lon": 76.6744,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 4.0,
    },
    # Mining & Extraction Fields
    {
        "id": "IND-MIN-001",
        "name": "Jharia Coalfield Underground Fire Zone",
        "type": "coal_mine",
        "lat": 23.7431,
        "lon": 86.4175,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": False,
        "buffer_km": 5.0,
    },
    {
        "id": "IND-MIN-002",
        "name": "Singrauli Open Cast Coal Mining Basin",
        "type": "coal_mine",
        "lat": 24.1950,
        "lon": 82.6840,
        "country": "India",
        "risk_category": "MEDIUM",
        "operational_flaring": False,
        "buffer_km": 4.0,
    },
    # Offshore & Coastal Gas Flares
    {
        "id": "IND-FLR-001",
        "name": "Mumbai High Offshore Flaring Platform Complex",
        "type": "offshore_flaring_platform",
        "lat": 19.4167,
        "lon": 71.3333,
        "country": "India",
        "risk_category": "HIGH",
        "operational_flaring": True,
        "buffer_km": 6.0,
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in kilometers between two geographic coordinates."""
    r = 6371.0  # Earth's radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_nearest_industrial_facility(lat: float, lon: float) -> Tuple[Dict, float]:
    """Finds the nearest registered industrial facility and distance in km."""
    min_dist = float("inf")
    nearest_fac = INDUSTRIAL_FACILITIES[0]

    for fac in INDUSTRIAL_FACILITIES:
        dist = haversine_distance_km(lat, lon, fac["lat"], fac["lon"])
        if dist < min_dist:
            min_dist = dist
            nearest_fac = fac

    return nearest_fac, round(min_dist, 3)


def calculate_industrial_density(lat: float, lon: float, radius_km: float = 10.0) -> int:
    """Counts number of industrial facilities within a given radius."""
    count = 0
    for fac in INDUSTRIAL_FACILITIES:
        dist = haversine_distance_km(lat, lon, fac["lat"], fac["lon"])
        if dist <= radius_km:
            count += 1
    return count


def estimate_land_cover_distances(lat: float, lon: float) -> Dict[str, float]:
    """
    Estimates distance to forest, agricultural land, and urban centers based on geospatial coordinates.
    Simulates high-precision LULC (Land Use / Land Cover) classification layers.
    """
    forest_centroids = [
        (21.75, 86.33),    # Simlipal National Park / Forest
        (14.50, 74.80),    # Western Ghats Evergreen Forests
        (-3.46, -62.21),   # Amazon Basin
        (37.86, -119.53),  # Yosemite / Sierra Nevada
        (23.40, 80.50),    # Central Indian Sal Forests
    ]

    agricultural_centroids = [
        (30.37, 76.77),    # Punjab-Haryana wheat/paddy crop belt
        (26.84, 80.94),    # UP Indo-Gangetic Plains
        (41.87, -87.62),   # Midwest Corn Belt
        (20.59, 78.96),    # Maharashtra cotton/soybean agricultural belt
    ]

    min_forest_dist = min(haversine_distance_km(lat, lon, f_lat, f_lon) for f_lat, f_lon in forest_centroids)
    min_agri_dist = min(haversine_distance_km(lat, lon, a_lat, a_lon) for a_lat, a_lon in agricultural_centroids)

    nearest_fac, ind_dist = find_nearest_industrial_facility(lat, lon)

    if ind_dist < 1.0:
        dist_to_forest = max(8.0, min_forest_dist)
        dist_to_farmland = max(5.0, min_agri_dist)
    else:
        dist_to_forest = min(min_forest_dist, 50.0)
        dist_to_farmland = min(min_agri_dist, 40.0)

    return {
        "dist_to_industrial_km": ind_dist,
        "dist_to_forest_km": round(dist_to_forest, 2),
        "dist_to_farmland_km": round(dist_to_farmland, 2),
        "nearest_facility_name": nearest_fac["name"],
        "nearest_facility_type": nearest_fac["type"],
        "nearest_facility_id": nearest_fac["id"],
    }


def _normalize_facility(facility: Dict) -> Dict:
    """Ensures dynamic OSM facility dict contains all standard schema keys."""
    fac_id = str(facility.get("id") or f"OSM-{len(INDUSTRIAL_FACILITIES) + 1}")
    name = str(facility.get("name") or "Industrial Facility")
    f_type = str(facility.get("type") or "industrial")
    lat = float(facility["lat"])
    lon = float(facility["lon"])
    country = str(facility.get("country") or "India")
    risk_cat = str(facility.get("risk_category") or "HIGH")
    flaring = bool(facility.get("operational_flaring", False))
    buffer_km = float(facility.get("buffer_km", 3.0))

    return {
        "id": fac_id,
        "name": name,
        "type": f_type,
        "lat": lat,
        "lon": lon,
        "country": country,
        "risk_category": risk_cat,
        "operational_flaring": flaring,
        "buffer_km": buffer_km,
        "is_osm_dynamic": True,
    }


def register_osm_facility(facility: Dict) -> bool:
    """Registers a dynamic OSM facility into the active in-memory catalog."""
    normalized = _normalize_facility(facility)
    for existing in INDUSTRIAL_FACILITIES:
        if existing["id"] == normalized["id"]:
            return False
    INDUSTRIAL_FACILITIES.append(normalized)
    return True


def bulk_register_osm_facilities(facilities: List[Dict]) -> int:
    """Bulk registers multiple facilities retrieved from OSM Overpass."""
    added = 0
    existing_ids = {f["id"] for f in INDUSTRIAL_FACILITIES}
    for f in facilities:
        try:
            normalized = _normalize_facility(f)
            if normalized["id"] not in existing_ids:
                INDUSTRIAL_FACILITIES.append(normalized)
                existing_ids.add(normalized["id"])
                added += 1
        except (KeyError, ValueError, TypeError) as err:
            continue
    return added


