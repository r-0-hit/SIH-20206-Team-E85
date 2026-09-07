import { Router } from 'express';
import {
  getActivityLogs,
  getSystemHealth,
  listUsers,
  clearActivityLogs,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and ADMIN role requirement
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

router.get('/health', getSystemHealth);
router.get('/users', listUsers);
router.get('/logs', getActivityLogs);
router.delete('/logs', clearActivityLogs);

export default router;

