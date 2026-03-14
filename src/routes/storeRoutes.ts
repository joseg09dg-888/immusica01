import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  activateAutoDistribute,
  deactivateAutoDistribute,
  getDistributions,
  forceDistribute
} from '../controllers/storeController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Activar distribución automática para un track
router.post('/track/:trackId/activate', activateAutoDistribute);

// Desactivar distribución automática
router.post('/track/:trackId/deactivate', deactivateAutoDistribute);

// Obtener distribuciones de un track
router.get('/track/:trackId', getDistributions);

// Forzar distribución ahora (opcional, pruebas)
router.post('/track/:trackId/force', forceDistribute);

export default router;