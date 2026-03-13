import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getVerificationStatus,
  startVerification,
  verificationCallback
} from '../controllers/spotifyVerificationController';

const router = express.Router();

// Ruta pública para el callback de Spotify
router.get('/callback', verificationCallback);

// Rutas protegidas
router.use(authenticate);
router.get('/status', getVerificationStatus);
router.get('/start', startVerification);

export default router;