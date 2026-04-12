import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  scheduleRelease,
  cancelScheduled,
  getReleaseInfo,
  getScheduledTracks
} from '../controllers/releaseController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Programar lanzamiento
router.post('/track/:trackId/schedule', scheduleRelease);

// Cancelar programación
router.delete('/track/:trackId/schedule', cancelScheduled);

// Obtener info de un track
router.get('/track/:trackId', getReleaseInfo);

// Listar todos los tracks programados del artista (root alias for frontend compatibility)
router.get('/', getScheduledTracks);
router.get('/scheduled', getScheduledTracks);

export default router;