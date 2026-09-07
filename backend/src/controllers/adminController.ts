import { Request, Response } from 'express';
import os from 'os';
import { getOne, query, run } from '../config/database.js';
import { mlClientService } from '../services/mlClient.js';
import { ActivityLog, User } from '../types/index.js';

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const mlHealth = await mlClientService.checkHealth();
    const dbCheck = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses');

    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();

    return res.json({
      success: true,
      data: {
        backend: {
          status: 'ONLINE',
          node_version: process.version,
          uptime_seconds: Math.floor(uptimeSeconds),
          memory_rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
          memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          os_platform: os.platform(),
          os_cpus: os.cpus().length,
        },
        database: {
          status: dbCheck ? 'CONNECTED' : 'DEGRADED',
          type: 'SQLite3 / Relational',
          total_records: dbCheck?.count || 0,
        },
        ml_service: {
          status: mlHealth.healthy ? 'ONLINE' : 'DEGRADED_FALLBACK_ACTIVE',
          endpoint: mlClientService['serviceUrl'],
          details: mlHealth.details || null,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('getSystemHealth error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health metrics.',
    });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await query<User>(
      'SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({
      success: true,
      data: users,
    });
  } catch (err: any) {
    console.error('listUsers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to list users.',
    });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await query<ActivityLog>(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return res.json({
      success: true,
      data: logs,
    });
  } catch (err: any) {
    console.error('getActivityLogs error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs.',
    });
  }
};

export const clearActivityLogs = async (req: Request, res: Response) => {
  try {
    await run('DELETE FROM activity_logs');
    return res.json({
      success: true,
      message: 'Activity logs cleared successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear logs.',
    });
  }
};

