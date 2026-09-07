import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getAnalyticsSummary);

export default router;

