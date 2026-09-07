import { Request, Response } from 'express';
import { getOne, query } from '../config/database.js';

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const totalRow = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses');
    const totalAnalyses = totalRow?.count || 0;

    // Counts by classification
    const classRows = await query<{ classification: string; count: number }>(
      'SELECT classification, COUNT(*) as count FROM analyses GROUP BY classification'
    );

    const classMap: Record<string, number> = {};
    for (const r of classRows) {
      classMap[r.classification] = r.count;
    }

    // Active high-risk emergency incidents
    const activeCriticalRow = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM analyses WHERE risk_score >= 80 AND status = 'ACTIVE'`
    );

    // Average risk score
    const avgRiskRow = await getOne<{ avg_risk: number }>(
      'SELECT AVG(risk_score) as avg_risk FROM analyses'
    );

    // Industrial vs Natural breakdown
    const industrialCount = (classMap['INDUSTRIAL_ACCIDENTAL_FIRE'] || 0) + (classMap['INDUSTRIAL_PERSISTENT'] || 0);
    const naturalCount = (classMap['WILDFIRE'] || 0) + (classMap['AGRICULTURAL_BURNING'] || 0);

    // Risk distribution tiers
    const riskDistribution = [
      {
        tier: 'Critical Hazard (80-100)',
        level: 'CRITICAL',
        color: '#ef4444',
        count: (await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses WHERE risk_score >= 80'))?.count || 0,
      },
      {
        tier: 'Elevated Risk (60-79)',
        level: 'ELEVATED',
        color: '#f97316',
        count: (await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses WHERE risk_score >= 60 AND risk_score < 80'))?.count || 0,
      },
      {
        tier: 'Moderate / Operational (35-59)',
        level: 'MODERATE',
        color: '#eab308',
        count: (await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses WHERE risk_score >= 35 AND risk_score < 60'))?.count || 0,
      },
      {
        tier: 'Low / Benign (< 35)',
        level: 'LOW',
        color: '#10b981',
        count: (await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses WHERE risk_score < 35'))?.count || 0,
      },
    ];

    // Classification chart items
    const classificationDistribution = [
      { name: 'Industrial Fire', key: 'INDUSTRIAL_ACCIDENTAL_FIRE', count: classMap['INDUSTRIAL_ACCIDENTAL_FIRE'] || 0, color: '#dc2626' },
      { name: 'Industrial Flare / Persistent', key: 'INDUSTRIAL_PERSISTENT', count: classMap['INDUSTRIAL_PERSISTENT'] || 0, color: '#8b5cf6' },
      { name: 'Wildfire', key: 'WILDFIRE', count: classMap['WILDFIRE'] || 0, color: '#ea580c' },
      { name: 'Agricultural Burning', key: 'AGRICULTURAL_BURNING', count: classMap['AGRICULTURAL_BURNING'] || 0, color: '#f59e0b' },
      { name: 'Mining Extraction', key: 'MINING_EXTRACTION', count: classMap['MINING_EXTRACTION'] || 0, color: '#64748b' },
      { name: 'Other / Noise', key: 'OTHER_OR_FALSE_ALARM', count: classMap['OTHER_OR_FALSE_ALARM'] || 0, color: '#94a3b8' },
    ];

    // Temporal detection trend (last 7 recorded dates)
    const trendRows = await query<{ date: string; count: number; industrial_count: number }>(
      `SELECT
         COALESCE(acq_date, strftime('%Y-%m-%d', created_at)) as date,
         COUNT(*) as count,
         SUM(CASE WHEN is_industrial = 1 THEN 1 ELSE 0 END) as industrial_count
       FROM analyses
       GROUP BY date
       ORDER BY date ASC
       LIMIT 10`
    );

    // High risk incidents feed
    const criticalIncidents = await query<any>(
      `SELECT id, lat, lon, frp, brightness, classification, risk_score, nearest_facility_name, status, created_at
       FROM analyses
       WHERE risk_score >= 75
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return res.json({
      success: true,
      data: {
        summary: {
          totalAnalyses,
          industrialAccidents: classMap['INDUSTRIAL_ACCIDENTAL_FIRE'] || 0,
          industrialPersistent: classMap['INDUSTRIAL_PERSISTENT'] || 0,
          wildfires: classMap['WILDFIRE'] || 0,
          agriculturalFires: classMap['AGRICULTURAL_BURNING'] || 0,
          miningFires: classMap['MINING_EXTRACTION'] || 0,
          activeCriticalAlerts: activeCriticalRow?.count || 0,
          avgRiskScore: Math.round((avgRiskRow?.avg_risk || 0) * 10) / 10,
          industrialCount,
          naturalCount,
        },
        riskDistribution,
        classificationDistribution,
        temporalTrends: trendRows,
        criticalIncidents,
      },
    });
  } catch (err: any) {
    console.error('getAnalyticsSummary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate analytics summary.',
    });
  }
};

