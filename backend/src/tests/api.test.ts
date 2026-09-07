import assert from 'assert';
import { initDatabase, getOne, query, run } from '../config/database.js';
import { mlClientService } from '../services/mlClient.js';

async function runTests() {
  console.log('--- Starting PyroGuard Backend Integration Tests ---');

  // Test 1: Database Initialization & Seeding
  await initDatabase();
  const userCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  assert(userCount && userCount.count >= 2, 'Default users must be seeded');
  console.log('✔ Test 1: Database initialized & default users seeded');

  // Test 2: Facilities Registry Check
  const facilities = await query('SELECT * FROM facilities');
  assert(facilities.length >= 10, 'Industrial facilities must be cataloged');
  console.log(`✔ Test 2: Industrial facilities verified (${facilities.length} records)`);

  // Test 3: Detection Seed Records
  const initialAnalyses = await query('SELECT * FROM analyses');
  assert(initialAnalyses.length >= 5, 'Initial thermal detections must be present');
  console.log(`✔ Test 3: Baseline thermal detections verified (${initialAnalyses.length} records)`);

  // Test 4: ML Inference Client & Fallback
  const prediction = await mlClientService.predict({
    lat: 22.3619,
    lon: 69.8318,
    brightness: 460.0,
    frp: 350.0,
    daynight: 'N',
    confidence: 'high',
  });
  assert(prediction.success, 'Prediction should succeed');
  assert(prediction.risk_score >= 80, 'Refinery fire should produce high risk score');
  console.log(`✔ Test 4: ML client inference verified (${prediction.classification}, Risk: ${prediction.risk_score})`);

  console.log('--- All Backend Integration Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

