import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { ENV } from './env.js';

const dbDir = path.dirname(ENV.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(ENV.DATABASE_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log(`Connected to SQLite database at ${ENV.DATABASE_PATH}`);
  }
});

export const query = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const getOne = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDatabase = async (): Promise<void> => {
  // Create schema tables
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ANALYST',
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      country TEXT NOT NULL,
      risk_category TEXT NOT NULL DEFAULT 'HIGH',
      operational_flaring INTEGER DEFAULT 0,
      buffer_km REAL DEFAULT 3.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
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
      is_industrial INTEGER DEFAULT 0,
      is_persistent INTEGER DEFAULT 0,
      nearest_facility_id TEXT,
      nearest_facility_name TEXT,
      nearest_facility_dist_km REAL,
      indicators_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      features_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id TEXT PRIMARY KEY,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SMS alert tracking table (for duplicate prevention and audit trail)
  await run(`
    CREATE TABLE IF NOT EXISTS sms_alerts (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      message_content TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'TWILIO',
      provider_message_id TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(analysis_id) REFERENCES analyses(id)
    );
  `);

  await run('CREATE INDEX IF NOT EXISTS idx_sms_alerts_analysis ON sms_alerts(analysis_id);');
  await run('CREATE INDEX IF NOT EXISTS idx_sms_alerts_status ON sms_alerts(status);');

  // Seed default users if table is empty
  const userCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    const adminPassword = await bcrypt.hash('Admin@12345', 10);
    const analystPassword = await bcrypt.hash('Analyst@12345', 10);

    await run(
      `INSERT INTO users (id, username, email, password_hash, role, full_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['USR-ADMIN-001', 'admin', 'admin@pyroguard.ai', adminPassword, 'ADMIN', 'Dr. Sarah Connor (Chief Operations)']
    );

    await run(
      `INSERT INTO users (id, username, email, password_hash, role, full_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['USR-ANALYST-001', 'analyst', 'analyst@pyroguard.ai', analystPassword, 'ANALYST', 'Alex Mercer (GIS Specialist)']
    );
    console.log('Default users seeded: admin@pyroguard.ai and analyst@pyroguard.ai');
  }

  // Seed facilities if table is empty
  const facilityCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM facilities');
  if (facilityCount && facilityCount.count === 0) {
    const seedPath = path.resolve(process.cwd(), '../database/seeds/facilities.json');
    if (fs.existsSync(seedPath)) {
      const facilities = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      for (const fac of facilities) {
        await run(
          `INSERT OR IGNORE INTO facilities (id, name, type, lat, lon, country, risk_category, operational_flaring, buffer_km)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [fac.id, fac.name, fac.type, fac.lat, fac.lon, fac.country, fac.risk_category, fac.operational_flaring, fac.buffer_km]
        );
      }
      console.log(`Seeded ${facilities.length} industrial facilities.`);
    }
  }

  // Seed initial detections if empty
  const analysisCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM analyses');
  if (analysisCount && analysisCount.count === 0) {
    const detectionsSeedPath = path.resolve(process.cwd(), '../database/seeds/detections.json');
    if (fs.existsSync(detectionsSeedPath)) {
      const detections = JSON.parse(fs.readFileSync(detectionsSeedPath, 'utf8'));
      for (const d of detections) {
        const defaultIndicators = JSON.stringify([
          `Proximity: ${d.nearest_facility_dist_km} km from ${d.nearest_facility_name}`,
          `Sensor Confidence: High radiometric contrast`,
          `FRP: ${d.frp} MW observed during satellite swath`,
        ]);
        const defaultRecommendations = JSON.stringify([
          d.classification === 'INDUSTRIAL_ACCIDENTAL_FIRE'
            ? 'IMMEDIATE DISPATCH: Emergency response team to refinery coordinates.'
            : 'ROUTINE MONITORING: Record detection in operational registry.',
        ]);
        const defaultFeatures = JSON.stringify({
          brightness: d.brightness,
          frp: d.frp,
          nearest_facility_dist_km: d.nearest_facility_dist_km,
        });

        await run(
          `INSERT OR IGNORE INTO analyses (
            id, user_id, lat, lon, brightness, frp, satellite, confidence, daynight,
            acq_date, acq_time, classification, confidence_score, risk_score,
            is_industrial, is_persistent, nearest_facility_id, nearest_facility_name,
            nearest_facility_dist_km, indicators_json, recommendations_json,
            features_json, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.id,
            'USR-ADMIN-001',
            d.lat,
            d.lon,
            d.brightness,
            d.frp,
            d.satellite,
            d.confidence,
            d.daynight,
            d.acq_date,
            d.acq_time,
            d.classification,
            d.confidence_score,
            d.risk_score,
            d.is_industrial,
            d.is_persistent,
            d.nearest_facility_id,
            d.nearest_facility_name,
            d.nearest_facility_dist_km,
            defaultIndicators,
            defaultRecommendations,
            defaultFeatures,
            d.status,
            `${d.acq_date} 12:00:00`,
          ]
        );
      }
      console.log(`Seeded ${detections.length} representative thermal detections.`);
    }
  }
};

