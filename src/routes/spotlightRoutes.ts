import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  submitToPlaylist,
  getMySubmissions,
  getSubmissionById
} from '../controllers/spotlightController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Enviar track a playlist
router.post('/submit', submitToPlaylist);

// Listar mis envíos
router.get('/submissions', getMySubmissions);

// Obtener detalle de un envío
router.get('/submissions/:id', getSubmissionById);

export default router;