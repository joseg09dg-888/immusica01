import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  registerInYouTube,
  getYouTubeStatus,
  listMyYouTubeRegistrations
} from '../controllers/youtubeController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Registrar track en Content ID
router.post('/register', registerInYouTube);

// Obtener estado de un track
router.get('/status/:trackId', getYouTubeStatus);

// Listar todos los registros del artista
router.get('/my', listMyYouTubeRegistrations);

export default router;