# PyroGuard AI - REST API Specification

All endpoints are prefixed with `/api`. Interactive Swagger documentation is accessible at `http://localhost:5000/api/docs`.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new user account.
- **Request Body**:
```json
{
  "username": "fire_commander",
  "email": "commander@facility.com",
  "password": "SecurePassword123",
  "fullName": "Capt. James Miller",
  "role": "ANALYST"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "USR-1725700000",
      "username": "fire_commander",
      "email": "commander@facility.com",
      "fullName": "Capt. James Miller",
      "role": "ANALYST"
    }
  }
}
```

### `POST /api/auth/login`
Authenticates user and issues JWT bearer token.
- **Request Body**:
```json
{
  "email": "admin@pyroguard.ai",
  "password": "Admin@12345"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "USR-ADMIN-001",
      "username": "admin",
      "email": "admin@pyroguard.ai",
      "fullName": "Dr. Sarah Connor (Chief Operations)",
      "role": "ADMIN"
    }
  }
}
```

### `GET /api/auth/me`
Returns current session profile. Requires `Authorization: Bearer <token>`.

---

## 2. Thermal Anomaly & GIS Endpoints

### `POST /api/detections/analyze`
Submits a coordinate and radiometric parameters for real-time AI classification and persistence scoring.
- **Authorization**: Bearer token
- **Request Body**:
```json
{
  "lat": 22.3619,
  "lon": 69.8318,
  "brightness": 465.0,
  "frp": 385.0,
  "satellite": "VIIRS-SNPP",
  "daynight": "N",
  "confidence": "high"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "DET-1725701123",
    "classification": "INDUSTRIAL_ACCIDENTAL_FIRE",
    "confidence": 0.975,
    "risk_score": 96,
    "is_industrial": true,
    "is_persistent": false,
    "nearest_facility": {
      "id": "IND-REF-001",
      "name": "Reliance Jamnagar Refinery Complex",
      "type": "petroleum_refinery",
      "distance_km": 0.12
    },
    "indicators": [
      "Direct Industrial Proximity: Located 0.12 km from Reliance Jamnagar Refinery Complex...",
      "Catastrophic Energy Surge: Fire Radiative Power (385.0 MW) significantly exceeds routine baselines...",
      "Nighttime Satellite Overpass: Confirmed during night swath eliminating solar glint..."
    ],
    "recommended_action": [
      "IMMEDIATE ACTION: Dispatch on-site emergency response teams and fire tender units.",
      "Initiate emergency plant shutdown and isolation of hydrocarbon feeds.",
      "Establish a 2.5 km perimeter exclusion zone downwind for toxic vapor containment."
    ],
    "status": "ACTIVE"
  }
}
```

### `GET /api/detections`
Lists paginated thermal detections with multi-factor filters.
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `20`)
  - `search`: Keyword for facility name, ID, or class
  - `classification`: `INDUSTRIAL_ACCIDENTAL_FIRE`, `INDUSTRIAL_PERSISTENT`, `WILDFIRE`, `AGRICULTURAL_BURNING`, `MINING_EXTRACTION`, `OTHER_OR_FALSE_ALARM`
  - `riskLevel`: `CRITICAL`, `ELEVATED`, `MODERATE`, `LOW`
  - `status`: `ACTIVE`, `VERIFIED`, `RESOLVED`, `FALSE_ALARM`

### `GET /api/detections/facilities`
Returns all cataloged high-risk industrial facilities for GIS overlays.

### `POST /api/detections/ingest-firms`
Ingests live satellite swaths from NASA FIRMS by geographic region.
- **Query Parameters**: `region` (`Global`, `South Asia`, `Middle East`, `Southeast Asia`, `North America`), `sensor` (`VIIRS-SNPP`, `VIIRS-NOAA20`, `MODIS`).

### `PATCH /api/detections/:id/status`
Updates incident status (`ACTIVE`, `VERIFIED`, `RESOLVED`, `FALSE_ALARM`).
- **Authorization**: Requires `ANALYST` or `ADMIN` role.

---

## 3. Analytics Endpoints

### `GET /api/analytics/summary`
Returns high-level platform KPI telemetry, risk distribution tiers, classification counts, and temporal trends.

---

## 4. Admin & Health Endpoints

### `GET /api/admin/health`
Returns microservice telemetry, memory usage, and database records count.
- **Authorization**: Requires `ADMIN` role.

### `GET /api/admin/logs`
Returns recent system security and operational audit records.

