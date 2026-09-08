import { apiRequest } from './api';
import { AnalyticsSummary, Detection, Facility } from '../types/index';

export interface DetectionFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  classification?: string;
  riskLevel?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedDetections {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  detections: Detection[];
}

export const detectionService = {
  async getDetections(params: DetectionFilterParams = {}): Promise<PaginatedDetections> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.classification) query.append('classification', params.classification);
    if (params.riskLevel) query.append('riskLevel', params.riskLevel);
    if (params.status) query.append('status', params.status);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiRequest<PaginatedDetections>(`/detections?${query.toString()}`);
  },

  async getDetectionById(id: string): Promise<Detection> {
    return apiRequest<Detection>(`/detections/${id}`);
  },

  async analyzeThermalSource(payload: {
    lat: number;
    lon: number;
    brightness: number;
    frp: number;
    daynight?: string;
    confidence?: any;
    satellite?: string;
  }): Promise<Detection> {
    return apiRequest<Detection>('/detections/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getFacilities(): Promise<Facility[]> {
    return apiRequest<Facility[]>('/detections/facilities');
  },

  async enrichFromOSM(params?: { lat?: number; lon?: number; radiusKm?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      totalDiscovered?: number;
      totalAddedToML?: number;
      fetched?: number;
      addedToML?: number;
      totalCataloged?: number;
      facilities?: any[];
      regionsScanned?: number;
      enrichedLocations?: any[];
    };
  }> {
    return apiRequest('/detections/enrich-osm', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  async ingestFIRMSSwath(region: string = 'Global', sensor: string = 'VIIRS-SNPP'): Promise<Detection[]> {
    return apiRequest<Detection[]>(`/detections/ingest-firms?region=${encodeURIComponent(region)}&sensor=${sensor}`, {
      method: 'POST',
    });
  },

  async updateDetectionStatus(id: string, status: string): Promise<{ id: string; status: string }> {
    return apiRequest<{ id: string; status: string }>(`/detections/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return apiRequest<AnalyticsSummary>('/analytics/summary');
  },

  async getSystemHealth(): Promise<any> {
    return apiRequest<any>('/admin/health');
  },

  async getAdminLogs(limit: number = 30): Promise<any[]> {
    return apiRequest<any[]>(`/admin/logs?limit=${limit}`);
  },

  async getUsers(): Promise<any[]> {
    return apiRequest<any[]>('/admin/users');
  },

  async getAlertStatus(): Promise<{
    enabled: boolean;
    provider: string;
    riskThreshold: number;
    recipientsCount: number;
    recipients: string[];
    botName: string;
    botUrl: string;
    spikeRule: string;
  }> {
    return apiRequest<any>('/detections/alerts/status');
  },

  async sendTestAlertPing(): Promise<{ success: boolean; message: string }> {
    return apiRequest<any>('/detections/alerts/test-ping', {
      method: 'POST',
    });
  },

  async dispatchIncidentAlert(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<any>(`/detections/${id}/dispatch-alert`, {
      method: 'POST',
    });
  },

  async dispatchCustomAlert(payload: {
    lat: number;
    lon: number;
    frp?: number;
    brightness?: number;
    nearestFacilityName?: string;
    facilityType?: string;
    classification?: string;
    riskScore?: number;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return apiRequest<any>('/detections/alerts/dispatch-custom', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

