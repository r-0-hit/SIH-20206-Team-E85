// ─────────────────────────────────────────────────────────────────────────────
// THERMOSAFE — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── New: Digital Twin & Prediction types ─────────────────────────────────────

export interface ThermalTwin {
  z_score: number;
  anomaly_ratio: number;
  expected_frp: number;
  anomaly_severity: 'NORMAL' | 'ELEVATED' | 'ANOMALOUS' | 'EXTREME';
  alert_message: string | null;
}

export interface ShapContribution {
  feature: string;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
  label: string;
}

export interface RiskTimeline {
  current: number;
  min_30: number;
  min_60: number;
  min_120: number;
  trend: 'ESCALATING' | 'STABLE' | 'DECLINING';
  growth_rate_pct: number;
  alert: string | null;
  lead_time_minutes: number | null;
}

export interface ThermalBaseline {
  hourly_means: number[];  // 24 floats, index = hour 0-23
  hourly_stds: number[];
  overall_mean: number;
  overall_std: number;
  sample_count: number;
  daily_frequency: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ANALYST' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
}

// ── Detections ────────────────────────────────────────────────────────────────

export type AnomalyClassification =
  | 'INDUSTRIAL_ACCIDENTAL_FIRE'
  | 'INDUSTRIAL_PERSISTENT'
  | 'WILDFIRE'
  | 'AGRICULTURAL_BURNING'
  | 'MINING_EXTRACTION'
  | 'OTHER_OR_FALSE_ALARM';

export type AnomalyStatus = 'ACTIVE' | 'VERIFIED' | 'RESOLVED' | 'FALSE_ALARM';

export interface Facility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  country: string;
  risk_category: string;
  operational_flaring: number;
  buffer_km: number;
}

export interface Detection {
  id: string;
  user_id?: string;
  lat: number;
  lon: number;
  brightness: number;
  frp: number;
  satellite: string;
  confidence: string;
  daynight: string;
  acq_date?: string;
  acq_time?: string;
  classification: AnomalyClassification;
  confidence_score: number;
  risk_score: number;
  is_industrial: boolean;
  is_persistent: boolean;
  nearest_facility_id?: string;
  nearest_facility_name?: string;
  nearest_facility_dist_km?: number;
  nearest_facility?: {
    id: string;
    name: string;
    type: string;
    distance_km: number;
  };
  land_cover_distances?: {
    industrial_km: number;
    forest_km: number;
    farmland_km: number;
  };
  persistence?: {
    persistence_score: number;
    historical_detections: number;
    is_persistent: boolean;
    is_anomalous_surge?: boolean;
    cluster_label?: string;
  };
  // ── THERMOSAFE additions ────────────────────────────────────────────────────
  thermal_twin?: ThermalTwin;
  shap_explanation?: ShapContribution[];
  prediction?: RiskTimeline;
  // ───────────────────────────────────────────────────────────────────────────
  indicators: string[];
  recommended_action: string[];
  probabilities?: Record<string, number>;
  features?: Record<string, number>;
  status: AnomalyStatus;
  created_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  summary: {
    totalAnalyses: number;
    industrialAccidents: number;
    industrialPersistent: number;
    wildfires: number;
    agriculturalFires: number;
    miningFires: number;
    activeCriticalAlerts: number;
    avgRiskScore: number;
    industrialCount: number;
    naturalCount: number;
  };
  riskDistribution: {
    tier: string;
    level: string;
    color: string;
    count: number;
  }[];
  classificationDistribution: {
    name: string;
    key: string;
    count: number;
    color: string;
  }[];
  temporalTrends: {
    date: string;
    count: number;
    industrial_count: number;
  }[];
  criticalIncidents: Detection[];
}
