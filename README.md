# SIH-20206-Team-E85

# 🔥 THERMOSAFE

### AI-Powered Industrial Thermal Intelligence & Fire Risk Monitoring

> **Don't just detect heat. Understand what the heat means.**

THERMOSAFE is an AI-powered geospatial intelligence platform for detecting, classifying, monitoring and prioritizing abnormal thermal activity using **NASA FIRMS, OpenStreetMap, satellite imagery and temporal analysis**.

The system is designed around a simple problem:

**A satellite can tell us that something is hot. But can we determine whether that heat is normal industrial activity, agricultural burning, a wildfire, or a potentially dangerous industrial fire?**

THERMOSAFE combines multiple sources of open geospatial data to answer that question and provide an explainable **0–100 risk score** for every detected thermal anomaly.

---

## 🎯 Problem

Satellite-based thermal monitoring systems such as NASA FIRMS are highly useful for identifying thermal anomalies, but a hotspot alone does not explain what is happening on the ground.

The same thermal signature could represent:

* 🏭 Industrial operations
* 🔥 Industrial fire
* 🌲 Forest/wildfire
* 🌾 Agricultural burning
* ⛏️ Mining activity
* 🔥 Gas flare
* ⚠️ Other persistent or abnormal thermal sources

SIH Problem Statement **SIH26162** asks for an AI-enabled system capable of integrating thermal anomaly data, land-cover information, industrial infrastructure databases and satellite imagery to identify and classify industrial fires and persistent thermal sources, while providing GIS-based visualization.

---

# 💡 Our Solution

THERMOSAFE creates a multi-stage intelligence pipeline:

```text
NASA FIRMS
    │
    ▼
Thermal Hotspot Detection
    │
    ▼
Geospatial Context ──────────────┐
    │                            │
    ├── OpenStreetMap            │
    ├── Industrial facilities    │
    ├── Land-use / land-cover    │
    └── Nearby critical assets   │
                                 │
    ▼                            │
Temporal Behaviour Analysis      │
    │                            │
    ├── Historical persistence   │
    ├── Temperature behaviour    │
    ├── Sudden change            │
    └── Growth / recurrence      │
                                 │
    ▼                            │
Satellite Image Verification ◄──┘
    │
    ▼
AI Risk Assessment
    │
    ├── Operational / Normal
    ├── Suspicious
    └── Probable Fire
    │
    ▼
Explainable 0–100 Risk Score
    │
    ▼
GIS Dashboard + Alerts
```

---

# 🛰️ Data Sources

THERMOSAFE is designed around open/public data sources.

### NASA FIRMS

Provides satellite-derived active fire and thermal anomaly observations.

Used for:

* Hotspot detection
* Location
* Acquisition time
* Thermal characteristics
* Temporal monitoring

### OpenStreetMap

Used through geospatial queries to understand the context surrounding a hotspot.

Examples:

* Industrial facilities
* Refineries
* Power plants
* Storage facilities
* Warehouses
* Roads
* Residential areas
* Other mapped infrastructure

### Satellite Imagery

Historical and recent satellite imagery is used to provide additional visual context and verify the environment around detected anomalies.

Potential sources include:

* Sentinel imagery
* Landsat imagery

### Historical Thermal Data

Past observations are used to determine whether a hotspot represents:

> **Normal persistent behaviour or an unusual thermal event.**

---

# 🧠 Core Intelligence

## 1. Hotspot Detection

THERMOSAFE ingests NASA FIRMS observations and identifies thermal anomalies.

Instead of treating every hotspot equally, each detection becomes an object for further investigation.

---

## 2. Location Intelligence

The hotspot is spatially analysed against its surroundings.

For example:

```text
                 ┌───────────────┐
                 │ Residential   │
                 │     Area      │
                 └───────┬───────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
      │        🔥 HOTSPOT                  │
      │                  │                  │
      │       🏭 Factory                   │
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
                   🛢️ Fuel Storage
```

The same thermal anomaly has a very different risk profile depending on what surrounds it.

---

# ⏳ 3. Temporal Behaviour Analysis

One of THERMOSAFE's key differentiators is **temporal intelligence**.

A single satellite observation can be misleading.

Instead, THERMOSAFE asks:

> **"What normally happens at this location?"**

Historical observations are analysed to determine:

* Persistence
* Frequency
* Recurrence
* Temperature behaviour
* Sudden changes
* Duration
* Spatial expansion
* Deviation from historical behaviour

### Example

A hotspot appearing repeatedly at approximately the same location and time over many observations could indicate a persistent industrial heat source.

However:

```text
Historical behaviour
────────────────────────────

Day 1     🔥
Day 2     🔥
Day 3     🔥
Day 4     🔥
Day 5     🔥
Day 6     🔥
Day 7     🔥

→ Persistent / likely operational
```

versus:

```text
Historical behaviour
────────────────────────────

Day 1     .
Day 2     .
Day 3     .
Day 4     .
Day 5     .
Day 6     .
Day 7     🔥🔥🔥

→ Sudden anomaly → investigate
```

---

# 🛰️ 4. Satellite-Based Verification

THERMOSAFE uses satellite imagery as another layer of evidence.

The objective is to understand:

> **"What actually exists at this location?"**

Historical imagery can help determine whether the area contains:

* Industrial infrastructure
* Forest
* Agricultural land
* Buildings
* Storage areas
* Other relevant land-use patterns

This provides an additional verification layer beyond the FIRMS hotspot itself.

---

# 🤖 5. AI Risk Assessment

THERMOSAFE combines multiple signals into an AI-based risk assessment.

Example features can include:

```text
Thermal intensity
Temporal persistence
Historical deviation
Hotspot growth
Industrial proximity
Land-cover type
Critical infrastructure proximity
Population/exposure
Surrounding hazardous facilities
Spatial clustering
```

These features are used by the machine-learning pipeline to produce a **0–100 composite risk score**.

### Example

|  Score | Classification | Interpretation                     |
| -----: | -------------- | ---------------------------------- |
|   0–30 | 🟢 Normal      | Likely persistent/operational heat |
|  31–70 | 🟠 Suspicious  | Requires monitoring/investigation  |
| 71–100 | 🔴 Critical    | High-priority investigation        |

> **Important:** The 0–100 score is a composite decision-support score. It is **not a direct physical measurement of fire severity**.

THERMOSAFE recommends investigation or escalation; it does not autonomously declare an emergency.

---

# 🔍 Explainable Risk

THERMOSAFE is not intended to behave like a black box.

Instead of displaying:

```text
Risk: 91/100
```

the dashboard should explain:

```text
RISK SCORE: 91/100 🔴

Why?

+ Sudden thermal increase
+ 4× historical baseline
+ Industrial facility nearby
+ Fuel storage within risk radius
+ Hotspot expansion detected
+ Residential population within exposure zone

Recommendation:
Priority investigation
```

This allows an operator to understand **why an anomaly was prioritized**.

---

# 🚨 6. Secondary Hazard Analysis

An industrial fire does not exist in isolation.

A major fire near a fuel depot, chemical facility or other hazardous installation can create cascading risks.

THERMOSAFE therefore analyses the surroundings of high-risk events.

Example:

```text
                 🔥
              FIRE EVENT
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
     🛢️ Fuel   🧪 Chemical  🏭 Factory
      Depot      Plant
        │
        ▼
   Secondary Risk
   Assessment
```

This allows the system to identify potentially vulnerable neighbouring infrastructure.

---

# 🗺️ GIS Dashboard

The dashboard provides a geographic view of thermal events.

### Example layers

* 🔥 FIRMS hotspots
* 🏭 Industrial facilities
* 🌲 Forest / vegetation
* 🌾 Agricultural areas
* 🛢️ Hazardous facilities
* 👥 Population/exposure
* 🚨 High-risk events
* 📈 Historical hotspot behaviour

Each hotspot can be selected to inspect its complete intelligence profile.

---

# 📊 Hotspot Intelligence Card

A hotspot can be represented as:

```text
─────────────────────────────────────
THERMOSAFE EVENT

Status:       🔴 PROBABLE FIRE
Risk Score:   94 / 100

Location:     Industrial Cluster
Land Use:     Petrochemical Facility

Thermal:
  Current:    Abnormally High
  Historical: Persistent baseline exceeded

Temporal:
  Persistence: Low
  Deviation:   High
  Growth:      Detected

Surroundings:
  Fuel Storage:      1.2 km
  Chemical Plant:    2.1 km
  Population Zone:   3.4 km

Recommendation:
  PRIORITY INVESTIGATION
─────────────────────────────────────
```

---

# 🧩 Technology Stack

## Data & Remote Sensing

* NASA FIRMS
* Sentinel imagery
* Landsat imagery
* OpenStreetMap
* Overpass API

## Machine Learning

* Python
* Scikit-learn
* Random Forest
* Feature engineering
* Temporal anomaly detection

## Geospatial Processing

* GeoPandas
* Shapely
* PostGIS
* Raster/vector processing

## Backend

* Python
* FastAPI / Flask
* PostgreSQL + PostGIS

## Frontend

* React
* Leaflet / MapLibre / Mapbox-compatible GIS visualization

> The exact stack can be adjusted according to the implementation.

---

# 🏗️ System Architecture

```text
                  ┌──────────────────┐
                  │    NASA FIRMS    │
                  └────────┬─────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Data Ingestion     │
                 │ & Normalization    │
                 └─────────┬──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌────────────┐
        │   OSM    │ │ Satellite│ │ Historical │
        │ Context  │ │ Imagery  │ │   Data     │
        └────┬─────┘ └────┬─────┘ └─────┬──────┘
             │            │             │
             └────────────┼─────────────┘
                          ▼
                 ┌───────────────────┐
                 │ Feature Engineering│
                 └──────────┬────────┘
                            ▼
                 ┌───────────────────┐
                 │ Temporal Analysis │
                 └──────────┬────────┘
                            ▼
                 ┌───────────────────┐
                 │ ML Risk Assessment│
                 │  Random Forest    │
                 └──────────┬────────┘
                            ▼
                 ┌───────────────────┐
                 │ Explainable Risk  │
                 │     0–100         │
                 └──────────┬────────┘
                            ▼
             ┌─────────────────────────────┐
             │       GIS Dashboard        │
             │     + Alerts + Reports      │
             └─────────────────────────────┘
```

---

# 📁 Project Structure

```text
THERMOSAFE/
│
├── backend/
│   ├── api/
│   ├── services/
│   ├── models/
│   └── main.py
│
├── ml/
│   ├── preprocessing/
│   ├── feature_engineering/
│   ├── training/
│   ├── inference/
│   └── models/
│
├── geospatial/
│   ├── firms/
│   ├── osm/
│   ├── satellite/
│   └── spatial_analysis/
│
├── frontend/
│   ├── components/
│   ├── maps/
│   ├── dashboard/
│   └── alerts/
│
├── data/
│   ├── sample/
│   └── processed/
│
├── notebooks/
│
├── docs/
│
├── tests/
│
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

* Python 3.10+
* Node.js 18+
* PostgreSQL
* PostGIS
* NASA FIRMS API/data access
* Internet connectivity for external geospatial APIs

## Clone

```bash
git clone <repository-url>
cd THERMOSAFE
```

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📈 Example Risk Assessment

### 🟢 Normal — 18/100

```text
Persistent industrial heat
Stable historical behaviour
No significant deviation

Action:
Monitor
```

### 🟠 Watch — 67/100

```text
Sudden hotspot
Industrial facility nearby
Historical deviation detected

Action:
Investigate
```

### 🔴 Critical — 94/100

```text
Rapid thermal increase
Industrial/fuel facility
Significant historical deviation
Nearby hazardous infrastructure

Action:
Priority emergency investigation
```

---

# 🌍 Impact

### Social

* Faster identification of potentially dangerous events
* Better prioritization for emergency response
* Improved situational awareness for nearby communities

### Economic

* Earlier identification of industrial incidents
* Reduced potential damage and downtime
* Low-cost deployment using public data

### Environmental

* Earlier detection of abnormal thermal events
* Improved monitoring of industrial and ecological areas
* Reduced potential environmental damage

### Scalability

The architecture is designed to scale from:

```text
Industrial Cluster
       ↓
City
       ↓
State
       ↓
Multiple States
       ↓
National Coverage
```

The pitch deck similarly proposes a phased rollout from pilot → regional → national monitoring.

---

# 🔮 Future Scope

Potential future extensions include:

* Real-time alerting
* Automated incident reports
* Multi-satellite fusion
* Advanced computer-vision analysis
* Population exposure modelling
* Fire-spread risk estimation
* Weather/wind integration
* Critical infrastructure dependency graphs
* Authority-specific dashboards
* API access for disaster-management organizations
* Edge/offline deployment for field teams

---

# 🧪 Validation Strategy

A key objective is to validate the system against historical events.

Evaluation should measure:

* Classification accuracy
* Precision / Recall
* F1-score
* False alarm rate
* Detection latency
* Risk-ranking quality
* Performance across different land-use categories

Special attention should be given to difficult cases such as:

```text
Persistent flare vs accidental fire
Agricultural burning vs industrial fire
Industrial heat vs wildfire
Short-duration fire vs satellite revisit gap
```

---

# ⚠️ Important Limitations

THERMOSAFE is a **decision-support system**, not a replacement for ground verification.

Satellite-derived thermal observations have limitations including:

* Spatial resolution
* Cloud cover
* Satellite revisit intervals
* Incomplete mapping data
* Ambiguous thermal sources
* Limited ground-truth labels

The system therefore combines multiple evidence sources rather than relying on a single hotspot.

---

# 🧠 Why THERMOSAFE?

Traditional approach:

```text
Satellite
   ↓
Hotspot
   ↓
Human investigation
```

THERMOSAFE:

```text
Satellite
   ↓
Hotspot
   ↓
What is here?
   ↓
What normally happens here?
   ↓
Is this behaviour abnormal?
   ↓
What surrounds it?
   ↓
How dangerous could it be?
   ↓
Why?
   ↓
Who should investigate first?
```

> ### **THERMOSAFE doesn't just detect heat — it tells authorities which heat matters.**

---

# 📚 References

* NASA FIRMS
* NASA Earthdata
* OpenStreetMap / Overpass API
* Copernicus Sentinel
* USGS Landsat
* Giglio et al., *An enhanced contextual fire detection algorithm for MODIS*
* Schroeder et al., *The New VIIRS 375 m active fire detection data product*
* Liu et al., *Identifying industrial heat sources using time-series of the VIIRS Nightfire product*
* Elvidge et al., *VIIRS Nightfire: Satellite pyrometry at night*

The research references above are also included in the team's SIH pitch material.

---

# 👥 Team

**Team E85**

Smart India Hackathon 2026

Problem Statement: **SIH26162**

---

# 📜 Disclaimer

THERMOSAFE provides an AI-assisted **risk assessment and decision-support output**.

A high risk score does not independently establish that a fire or emergency exists. Real-world emergency decisions should be verified through appropriate authoritative and ground-level channels.
