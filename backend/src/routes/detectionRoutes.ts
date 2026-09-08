import { Router } from 'express';
import {
  analyzeThermalSource,
  getDetections,
  getDetectionById,
  updateDetectionStatus,
  getFacilities,
  fetchFIRMSSwath,
  getAlertStatus,
  sendTestAlertPing,
  dispatchIncidentAlert,
  dispatchCustomAlert,
  enrichFromOSM,
} from '../controllers/detectionController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Alert configuration & test endpoints (Accessible for emergency dispatch)
router.get('/alerts/status', getAlertStatus);
router.post('/alerts/test-ping', sendTestAlertPing);
router.post('/alerts/dispatch-custom', dispatchCustomAlert);

// OpenStreetMap dynamic facility enrichment
router.post('/enrich-osm', enrichFromOSM);
router.get('/enrich-osm', enrichFromOSM);

// Public / Semi-public listing endpoints
router.get('/', getDetections);
router.get('/facilities', getFacilities);
router.get('/firms-swath', fetchFIRMSSwath);
router.get('/ingest-firms', fetchFIRMSSwath);
router.get('/:id', getDetectionById);

// Protected analysis & update endpoints
router.post('/analyze', authenticateToken, analyzeThermalSource);
router.post('/ingest-firms', authenticateToken, fetchFIRMSSwath);
router.post('/:id/dispatch-alert', dispatchIncidentAlert);
router.patch('/:id/status', authenticateToken, requireRole(['ANALYST', 'ADMIN']), updateDetectionStatus);

export default router;

