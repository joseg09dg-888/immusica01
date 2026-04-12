import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadDailyStats,
  getTrackStats,
  getArtistSummary,
  getArtistTracks
} from '../controllers/statsController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir CSV de estadísticas
router.post('/upload', uploadDailyStats);

// Obtener estadísticas de un track específico
router.get('/track/:trackId', getTrackStats);

// Obtener resumen general del artista (root alias for frontend compatibility)
router.get('/', getArtistSummary);
router.get('/summary', getArtistSummary);

// Obtener lista de tracks del artista (para selects)
router.get('/tracks', getArtistTracks);

export default router;