export type UserRole = 'USER' | 'ANALYST' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

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
  created_at?: string;
}

export interface AnalysisRecord {
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
  indicators_json: string;
  recommendations_json: string;
  features_json: string;
  status: AnomalyStatus;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

