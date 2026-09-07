import { Router } from 'express';
import {
  analyzeThermalSource,
  getDetections,
  getDetectionById,
  updateDetectionStatus,
  getFacilities,
  fetchFIRMSSwath,
} from '../controllers/detectionController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public / Semi-public listing endpoints
router.get('/', getDetections);
router.get('/facilities', getFacilities);
router.get('/:id', getDetectionById);

// Protected analysis & update endpoints
router.post('/analyze', authenticateToken, analyzeThermalSource);
router.post('/ingest-firms', authenticateToken, fetchFIRMSSwath);
router.patch('/:id/status', authenticateToken, requireRole(['ANALYST', 'ADMIN']), updateDetectionStatus);

export default router;

