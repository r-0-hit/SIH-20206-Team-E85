import { Request, Response } from 'express';
import { z } from 'zod';
import { getOne, query, run } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { firmsService } from '../services/firmsService.js';
import { mlClientService } from '../services/mlClient.js';
import { notificationService } from '../services/notificationService.js';
import { osmService } from '../services/osmService.js';
import { AnalysisRecord, Facility } from '../types/index.js';

const analyzeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  brightness: z.number().min(250).max(600),
  frp: z.number().min(0.1).max(2500),
  daynight: z.enum(['D', 'N', 'Day', 'Night']).optional().default('N'),
  confidence: z.any().optional().default('nominal'),
  satellite: z.string().optional().default('VIIRS-SNPP'),
  acq_date: z.string().optional(),
  acq_time: z.string().optional(),
});

export const analyzeThermalSource = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = analyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate or satellite parameter values.',
        errors: parseResult.error.errors,
      });
    }

    const input = parseResult.data;
    const daynightCode = input.daynight.startsWith('D') ? 'D' : 'N';
    const acqDate = input.acq_date || new Date().toISOString().split('T')[0];
    const acqTime = input.acq_time || new Date().toTimeString().slice(0, 5).replace(':', '');

    // 1. Invoke ML Inference
    const mlResult = await mlClientService.predict({
      lat: input.lat,
      lon: input.lon,
      brightness: input.brightness,
      frp: input.frp,
      daynight: daynightCode,
      confidence: input.confidence,
      satellite: input.satellite,
      acq_date: acqDate,
      acq_time: acqTime,
    });

    const analysisId = `DET-${Date.now()}`;
    const userId = req.user?.id || 'USR-ANALYST-001';

    // 2. Persist to Database
    await run(
      `INSERT INTO analyses (
        id, user_id, lat, lon, brightness, frp, satellite, confidence, daynight,
        acq_date, acq_time, classification, confidence_score, risk_score,
        is_industrial, is_persistent, nearest_facility_id, nearest_facility_name,
        nearest_facility_dist_km, indicators_json, recommendations_json,
        features_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysisId,
        userId,
        input.lat,
        input.lon,
        input.brightness,
        input.frp,
        input.satellite,
        String(input.confidence),
        daynightCode,
        acqDate,
        acqTime,
        mlResult.classification,
        mlResult.confidence,
        mlResult.risk_score,
        mlResult.is_industrial ? 1 : 0,
        mlResult.is_persistent ? 1 : 0,
        mlResult.nearest_facility.id,
        mlResult.nearest_facility.name,
        mlResult.nearest_facility.distance_km,
        JSON.stringify(mlResult.indicators),
        JSON.stringify(mlResult.recommended_action),
        JSON.stringify(mlResult.features),
        'ACTIVE',
        new Date().toISOString(),
      ]
    );

    // 3. Log audit event
    await run(
      'INSERT INTO activity_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [
        `LOG-${Date.now()}`,
        userId,
        'ANALYSIS_CREATED',
        `Analyzed thermal anomaly at [${input.lat}, ${input.lon}]: ${mlResult.classification} (Risk: ${mlResult.risk_score})`,
        req.ip || '127.0.0.1',
      ]
    );

    // 4. Fire-and-forget: Alert ONLY if there is a true sudden spike / emergency surge
    notificationService.evaluateAndNotify({
      analysisId,
      lat: input.lat,
      lon: input.lon,
      classification: mlResult.classification,
      riskScore: mlResult.risk_score,
      nearestFacilityName: mlResult.nearest_facility?.name || '',
      facilityType: mlResult.nearest_facility?.type || '',
      frp: input.frp,
      distanceKm: mlResult.nearest_facility?.distance_km,
      isIndustrial: mlResult.is_industrial,
      anomalyRatio: mlResult.thermal_twin?.anomaly_ratio || mlResult.persistence?.frp_surge_ratio || 1.0,
      zScore: mlResult.thermal_twin?.z_score || 0.0,
      expectedFrp: mlResult.thermal_twin?.expected_frp,
      isAnomalousSurge: Boolean(
        mlResult.persistence?.is_anomalous_surge ||
        mlResult.thermal_twin?.anomaly_severity === 'ANOMALOUS' ||
        mlResult.thermal_twin?.anomaly_severity === 'EXTREME' ||
        (mlResult.thermal_twin?.anomaly_ratio && mlResult.thermal_twin.anomaly_ratio >= 2.0)
      ),
    });

    return res.status(201).json({
      success: true,
      message: 'Thermal anomaly classified and persisted successfully.',
      data: {
        id: analysisId,
        lat: input.lat,
        lon: input.lon,
        brightness: input.brightness,
        frp: input.frp,
        satellite: input.satellite,
        daynight: daynightCode,
        acq_date: acqDate,
        acq_time: acqTime,
        classification: mlResult.classification,
        confidence: mlResult.confidence,
        risk_score: mlResult.risk_score,
        is_industrial: mlResult.is_industrial,
        is_persistent: mlResult.is_persistent,
        nearest_facility: mlResult.nearest_facility,
        land_cover_distances: mlResult.land_cover_distances,
        persistence: mlResult.persistence,
        thermal_twin: mlResult.thermal_twin,
        shap_explanation: mlResult.shap_explanation,
        prediction: mlResult.prediction,
        indicators: mlResult.indicators,
        recommended_action: mlResult.recommended_action,
        probabilities: mlResult.probabilities,
        features: mlResult.features,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Analyze error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete thermal analysis.',
      errorCode: 'ANALYSIS_FAILED',
    });
  }
};

export const getDetections = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const search = req.query.search as string;
    const classification = req.query.classification as string;
    const riskLevel = req.query.riskLevel as string;
    const status = req.query.status as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(nearest_facility_name LIKE ? OR classification LIKE ? OR id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (classification && classification !== 'ALL') {
      conditions.push('classification = ?');
      params.push(classification);
    }

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (riskLevel && riskLevel !== 'ALL') {
      if (riskLevel === 'CRITICAL') conditions.push('risk_score >= 80');
      else if (riskLevel === 'ELEVATED') conditions.push('risk_score >= 60 AND risk_score < 80');
      else if (riskLevel === 'MODERATE') conditions.push('risk_score >= 35 AND risk_score < 60');
      else if (riskLevel === 'LOW') conditions.push('risk_score < 35');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matches
    const countResult = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM analyses ${whereClause}`,
      params
    );
    const total = countResult?.count || 0;

    // Fetch paginated records
    const allowedSortColumns = ['created_at', 'risk_score', 'frp', 'brightness', 'confidence_score'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const rows = await query<any>(
      `SELECT * FROM analyses ${whereClause} ORDER BY ${safeSortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const formatted = rows.map((r) => ({
      ...r,
      is_industrial: Boolean(r.is_industrial),
      is_persistent: Boolean(r.is_persistent),
      indicators: JSON.parse(r.indicators_json || '[]'),
      recommended_action: JSON.parse(r.recommendations_json || '[]'),
      features: JSON.parse(r.features_json || '{}'),
    }));

    return res.json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        detections: formatted,
      },
    });
  } catch (err: any) {
    console.error('getDetections error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve detection history.',
      errorCode: 'FETCH_FAILED',
    });
  }
};

export const getDetectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await getOne<any>('SELECT * FROM analyses WHERE id = ?', [id]);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Detection with ID ${id} was not found.`,
        errorCode: 'NOT_FOUND',
      });
    }

    const result = {
      ...record,
      is_industrial: Boolean(record.is_industrial),
      is_persistent: Boolean(record.is_persistent),
      indicators: JSON.parse(record.indicators_json || '[]'),
      recommended_action: JSON.parse(record.recommendations_json || '[]'),
      features: JSON.parse(record.features_json || '{}'),
    };

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('getDetectionById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve detection report.',
    });
  }
};

export const updateDetectionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['ACTIVE', 'VERIFIED', 'RESOLVED', 'FALSE_ALARM'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const existing = await getOne<any>('SELECT id FROM analyses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Detection not found' });
    }

    await run('UPDATE analyses SET status = ? WHERE id = ?', [status, id]);

    // Audit log
    await run(
      'INSERT INTO activity_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [
        `LOG-${Date.now()}`,
        req.user?.id || 'ANONYMOUS',
        'STATUS_UPDATED',
        `Detection ${id} status updated to ${status}`,
        req.ip || '127.0.0.1',
      ]
    );

    return res.json({
      success: true,
      message: `Detection status successfully updated to ${status}.`,
      data: { id, status },
    });
  } catch (err: any) {
    console.error('updateDetectionStatus error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update detection status.',
    });
  }
};

export const getFacilities = async (req: Request, res: Response) => {
  try {
    const facilities = await query<Facility>('SELECT * FROM facilities ORDER BY name ASC');
    return res.json({
      success: true,
      data: facilities,
    });
  } catch (err: any) {
    console.error('getFacilities error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve industrial facilities.',
    });
  }
};

export const fetchFIRMSSwath = async (req: AuthRequest, res: Response) => {
  try {
    const region = (req.query.region as string) || 'Global';
    const sensor = (req.query.sensor as any) || 'VIIRS-SNPP';
    const rawAnomalies = await firmsService.getLiveSwath({ region, sensor, limit: 12 });

    const analyzedAnomalies = [];

    for (const raw of rawAnomalies) {
      const ml = await mlClientService.predict({
        lat: raw.lat,
        lon: raw.lon,
        brightness: raw.brightness,
        frp: raw.frp,
        daynight: raw.daynight,
        confidence: raw.confidence,
        satellite: raw.satellite,
        acq_date: raw.acq_date,
        acq_time: raw.acq_time,
      });

      const analysisId = raw.id || `DET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await run(
        `INSERT OR REPLACE INTO analyses (
          id, user_id, lat, lon, brightness, frp, satellite, confidence, daynight,
          acq_date, acq_time, classification, confidence_score, risk_score,
          is_industrial, is_persistent, nearest_facility_id, nearest_facility_name,
          nearest_facility_dist_km, indicators_json, recommendations_json,
          features_json, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          analysisId,
          req.user?.id || 'USR-ADMIN-001',
          raw.lat,
          raw.lon,
          raw.brightness,
          raw.frp,
          raw.satellite,
          raw.confidence,
          raw.daynight,
          raw.acq_date,
          raw.acq_time,
          ml.classification,
          ml.confidence,
          ml.risk_score,
          ml.is_industrial ? 1 : 0,
          ml.is_persistent ? 1 : 0,
          ml.nearest_facility.id,
          ml.nearest_facility.name,
          ml.nearest_facility.distance_km,
          JSON.stringify(ml.indicators),
          JSON.stringify(ml.recommended_action),
          JSON.stringify(ml.features),
          'ACTIVE',
          new Date().toISOString(),
        ]
      );

      // Persist raw FIRMS observation into hotspot_history table for dynamic baseline learning
      const acqHour = raw.acq_time ? parseInt(raw.acq_time.slice(0, 2)) || 0 : 12;
      try {
        await run(
          `INSERT OR IGNORE INTO hotspot_history (
            id, lat, lon, frp, brightness, confidence, satellite, daynight,
            acq_date, acq_time, acq_hour, nearest_facility_id, nearest_facility_dist_km
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `HIST-${analysisId}`,
            raw.lat,
            raw.lon,
            raw.frp,
            raw.brightness,
            String(raw.confidence),
            raw.satellite,
            raw.daynight,
            raw.acq_date,
            raw.acq_time,
            acqHour,
            ml.nearest_facility.id,
            ml.nearest_facility.distance_km,
          ]
        );
      } catch (e) {
        // Continue gracefully if table constraint triggers
      }

      // Fire-and-forget: Alert ONLY if there is a true sudden spike / emergency surge
      notificationService.evaluateAndNotify({
        analysisId,
        lat: raw.lat,
        lon: raw.lon,
        classification: ml.classification,
        riskScore: ml.risk_score,
        nearestFacilityName: ml.nearest_facility?.name || '',
        facilityType: ml.nearest_facility?.type || '',
        frp: raw.frp,
        distanceKm: ml.nearest_facility?.distance_km,
        isIndustrial: ml.is_industrial,
        anomalyRatio: ml.thermal_twin?.anomaly_ratio || ml.persistence?.frp_surge_ratio || 1.0,
        zScore: ml.thermal_twin?.z_score || 0.0,
        expectedFrp: ml.thermal_twin?.expected_frp,
        isAnomalousSurge: Boolean(
          ml.persistence?.is_anomalous_surge ||
          ml.thermal_twin?.anomaly_severity === 'ANOMALOUS' ||
          ml.thermal_twin?.anomaly_severity === 'EXTREME' ||
          (ml.thermal_twin?.anomaly_ratio && ml.thermal_twin.anomaly_ratio >= 2.0)
        ),
      });

      analyzedAnomalies.push({
        ...raw,
        id: analysisId,
        classification: ml.classification,
        confidence_score: ml.confidence,
        risk_score: ml.risk_score,
        is_industrial: ml.is_industrial,
        is_persistent: ml.is_persistent,
        nearest_facility: ml.nearest_facility,
        indicators: ml.indicators,
        recommended_action: ml.recommended_action,
        status: 'ACTIVE',
      });
    }

    return res.json({
      success: true,
      message: `Successfully ingested and analyzed ${analyzedAnomalies.length} NASA FIRMS detections for ${region}.`,
      data: analyzedAnomalies,
    });
  } catch (err: any) {
    console.error('fetchFIRMSSwath error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to ingest NASA FIRMS satellite data.',
    });
  }
};

export const getAlertStatus = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: notificationService.getStatus(),
  });
};

export const sendTestAlertPing = async (_req: Request, res: Response) => {
  try {
    const result = await notificationService.sendTestPing();
    if (result.success) {
      return res.json({
        success: true,
        message: 'Live test ping sent to Telegram successfully!',
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to dispatch test ping to Telegram.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error executing Telegram test ping.',
    });
  }
};

export const dispatchIncidentAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await getOne<any>('SELECT * FROM analyses WHERE id = ?', [id]);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Incident ${id} was not found.`,
      });
    }

    const result = await notificationService.dispatchManualAlert({
      analysisId: record.id,
      lat: record.lat,
      lon: record.lon,
      classification: record.classification,
      riskScore: record.risk_score,
      nearestFacilityName: record.nearest_facility_name || '',
      facilityType: '',
      frp: record.frp,
      distanceKm: record.nearest_facility_dist_km,
      isIndustrial: Boolean(record.is_industrial),
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Telegram emergency alert dispatched for ${id}!`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to dispatch alert to Telegram.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error dispatching incident alert.',
    });
  }
};

export const dispatchCustomAlert = async (req: Request, res: Response) => {
  try {
    const { lat, lon, frp, brightness, nearestFacilityName, facilityType, classification, riskScore } = req.body;

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and Longitude are required.',
      });
    }

    const analysisId = `MANUAL-ALERT-${Date.now()}`;
    const result = await notificationService.dispatchManualAlert({
      analysisId,
      lat: Number(lat),
      lon: Number(lon),
      classification: classification || 'MANUAL_EMERGENCY_ALERT',
      riskScore: Number(riskScore) || 92,
      nearestFacilityName: nearestFacilityName || 'Manual Operator Pin',
      facilityType: facilityType || 'industrial',
      frp: frp !== undefined ? Number(frp) : undefined,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Telegram alert dispatched for [${lat}, ${lon}]!`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to dispatch alert to Telegram.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error dispatching manual alert.',
    });
  }
};

/**
 * POST /api/detections/enrich-osm
 * Discovers real industrial infrastructure from OpenStreetMap Overpass API,
 * stores it into SQLite, and registers it dynamically into the ML microservice's active catalog.
 */
export const enrichFromOSM = async (req: Request, res: Response) => {
  try {
    const lat = req.body.lat ? parseFloat(req.body.lat) : undefined;
    const lon = req.body.lon ? parseFloat(req.body.lon) : undefined;
    const radiusKm = req.body.radiusKm ? parseFloat(req.body.radiusKm) : 25;

    if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
      // Direct coordinate enrichment
      const result = await osmService.syncAndRegisterNear(lat, lon, radiusKm);
      return res.json({
        success: true,
        message: `Discovered and cataloged ${result.fetched} facilities from OpenStreetMap near (${lat}, ${lon}).`,
        data: result,
      });
    }

    // Auto-enrich for recent detections that don't have a close facility
    const distantDetections = await query<any>(
      `SELECT lat, lon, nearest_facility_dist_km FROM analyses
       WHERE nearest_facility_dist_km > 15.0
       ORDER BY frp DESC LIMIT 5`
    );

    let totalDiscovered = 0;
    let totalAdded = 0;
    const enrichedLocations: any[] = [];

    for (const d of distantDetections) {
      try {
        const syncRes = await osmService.syncAndRegisterNear(d.lat, d.lon, 25);
        totalDiscovered += syncRes.fetched;
        totalAdded += syncRes.addedToML;
        if (syncRes.fetched > 0) {
          enrichedLocations.push({
            lat: d.lat,
            lon: d.lon,
            facilities: syncRes.facilities.map((f: any) => f.name),
          });
        }
      } catch (subErr: any) {
        console.warn(`OSM sync sub-error for [${d.lat}, ${d.lon}]:`, subErr.message);
      }
    }

    return res.json({
      success: true,
      message: `OpenStreetMap dynamic sync completed across ${distantDetections.length} regions. Discovered ${totalDiscovered} industrial facilities, registered ${totalAdded} into ML catalog.`,
      data: {
        totalDiscovered,
        totalAddedToML: totalAdded,
        regionsScanned: distantDetections.length,
        enrichedLocations,
      },
    });
  } catch (err: any) {
    console.error('enrichFromOSM error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to complete OpenStreetMap enrichment: ${err.message}`,
    });
  }
};
