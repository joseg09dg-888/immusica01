import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSummary,
  uploadRoyalties,
  getAllRoyalties,
  getWithholdingsByTrack,
  getMyWithholdings,
  releaseWithholding
} from '../controllers/royaltyController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/summary', getSummary);
router.post('/upload', uploadRoyalties);
router.get('/', authorize('admin'), getAllRoyalties);

// Rutas para retenciones
router.get('/withholdings/track/:trackId', getWithholdingsByTrack);
router.get('/withholdings/my', getMyWithholdings);
router.put('/withholdings/:withholdingId/release', releaseWithholding);

export default router;