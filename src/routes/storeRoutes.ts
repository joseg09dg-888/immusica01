import express from 'express';
import { authenticate, requirePlan } from '../middleware/auth';
import {
  activateAutoDistribute,
  deactivateAutoDistribute,
  getDistributions,
  forceDistribute
} from '../controllers/storeController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Activar distribución automática (requiere plan pro)
router.post('/track/:trackId/activate', requirePlan('pro'), activateAutoDistribute);

// Desactivar distribución automática
router.post('/track/:trackId/deactivate', deactivateAutoDistribute);

// Obtener distribuciones de un track
router.get('/track/:trackId', getDistributions);

// Forzar distribución ahora (opcional, pruebas)
router.post('/track/:trackId/force', forceDistribute);

export default router;