import { Router } from 'express';
import { syncData, uploadTelemetry } from '../controllers/sync.controller';

const router = Router();

// Endpoint for general data sync (Niño, Diagnósticos, Alertas)
router.post('/', syncData);

// Endpoint for local offline AI telemetry (ground-truth comparisons for calibration)
router.post('/telemetry', uploadTelemetry);

export default router;
