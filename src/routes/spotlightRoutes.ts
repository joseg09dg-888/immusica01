import express from 'express';
import { authenticate, requirePlan } from '../middleware/auth';
import {
  submitToPlaylist,
  getMySubmissions,
  getSubmissionById
} from '../controllers/spotlightController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Enviar track a playlist (requiere plan indie o superior)
router.post('/submit', requirePlan('indie'), submitToPlaylist);

// Listar mis envíos
router.get('/submissions', getMySubmissions);

// Obtener detalle de un envío
router.get('/submissions/:id', getSubmissionById);

export default router;