-- PyroGuard AI Database Schema
-- Compatible with SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ANALYST', -- 'ANALYST' or 'ADMIN'
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    country TEXT NOT NULL,
    risk_category TEXT NOT NULL DEFAULT 'HIGH',
    operational_flaring BOOLEAN DEFAULT 0,
    buffer_km REAL DEFAULT 3.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    brightness REAL NOT NULL,
    frp REAL NOT NULL,
    satellite TEXT NOT NULL DEFAULT 'VIIRS',
    confidence TEXT NOT NULL DEFAULT 'nominal',
    daynight TEXT NOT NULL DEFAULT 'N',
    acq_date TEXT,
    acq_time TEXT,
    classification TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    risk_score INTEGER NOT NULL,
    is_industrial BOOLEAN DEFAULT 0,
    is_persistent BOOLEAN DEFAULT 0,
    nearest_facility_id TEXT,
    nearest_facility_name TEXT,
    nearest_facility_dist_km REAL,
    indicators_json TEXT NOT NULL,
    recommendations_json TEXT NOT NULL,
    features_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'VERIFIED', 'RESOLVED', 'FALSE_ALARM'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_metrics (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analyses_risk ON analyses(risk_score);
CREATE INDEX IF NOT EXISTS idx_analyses_classification ON analyses(classification);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(lat, lon);

-- ─────────────────────────────────────────────────────────────────────────────
-- THERMOSAFE EXTENSION TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Raw FIRMS hotspot ingestion history (for baseline building & temporal analysis)
CREATE TABLE IF NOT EXISTS hotspot_history (
    id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    frp REAL NOT NULL,
    brightness REAL NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'nominal',
    satellite TEXT NOT NULL DEFAULT 'VIIRS',
    daynight TEXT NOT NULL DEFAULT 'N',
    acq_date TEXT NOT NULL,
    acq_time TEXT NOT NULL DEFAULT '0000',
    acq_hour INTEGER NOT NULL DEFAULT 0,  -- 0-23 for baseline grouping
    nearest_facility_id TEXT,
    nearest_facility_dist_km REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotspot_history_facility ON hotspot_history(nearest_facility_id);
CREATE INDEX IF NOT EXISTS idx_hotspot_history_date ON hotspot_history(acq_date);
CREATE INDEX IF NOT EXISTS idx_hotspot_history_coords ON hotspot_history(lat, lon);

-- OSM-sourced industrial facilities cache (refreshed periodically via Overpass API)
CREATE TABLE IF NOT EXISTS osm_facilities (
    id TEXT PRIMARY KEY,          -- OSM node/way ID
    name TEXT NOT NULL DEFAULT 'Unknown Facility',
    type TEXT NOT NULL,           -- industrial, factory, refinery, chemical, power, etc.
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    tags_json TEXT,               -- raw OSM tags as JSON string
    source TEXT NOT NULL DEFAULT 'OSM',
    region TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_osm_facilities_coords ON osm_facilities(lat, lon);
CREATE INDEX IF NOT EXISTS idx_osm_facilities_type ON osm_facilities(type);

-- Future risk projections (Digital Twin prediction output)
CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,    -- FK to analyses.id
    current_risk INTEGER NOT NULL,
    risk_30min INTEGER,
    risk_60min INTEGER,
    risk_120min INTEGER,
    trend TEXT NOT NULL DEFAULT 'STABLE',   -- ESCALATING | STABLE | DECLINING
    growth_rate_pct REAL,
    alert_message TEXT,
    lead_time_minutes INTEGER,    -- minutes until risk crosses 80, NULL if never
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_analysis ON predictions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_predictions_trend ON predictions(trend);

-- Thermal baselines per facility (facility digital twin profiles)
CREATE TABLE IF NOT EXISTS thermal_baselines (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL UNIQUE,
    facility_name TEXT,
    hourly_means_json TEXT NOT NULL,   -- JSON array of 24 floats (mean FRP by hour)
    hourly_stds_json TEXT NOT NULL,    -- JSON array of 24 floats (std FRP by hour)
    overall_mean REAL NOT NULL,
    overall_std REAL NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 0,
    daily_frequency REAL NOT NULL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tiered alert system (NORMAL / WATCH / INVESTIGATE / CRITICAL)
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    hotspot_lat REAL NOT NULL,
    hotspot_lon REAL NOT NULL,
    facility_name TEXT,
    alert_level TEXT NOT NULL,         -- NORMAL | WATCH | INVESTIGATE | CRITICAL
    risk_score INTEGER NOT NULL,
    risk_120min INTEGER,
    trend TEXT,
    message TEXT NOT NULL,
    acknowledged INTEGER NOT NULL DEFAULT 0,   -- 0=false, 1=true
    acknowledged_by TEXT,
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
