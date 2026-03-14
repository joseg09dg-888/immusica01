import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  purchaseLegacy,
  purchaseLegacyForAll,
  getLegacyStatus,
  listLegacyPurchases
} from '../controllers/legacyController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Comprar Leave a Legacy para un track específico
router.post('/purchase', purchaseLegacy);

// Comprar Leave a Legacy para todo el catálogo
router.post('/purchase-all', purchaseLegacyForAll);

// Ver estado de un track
router.get('/status/:trackId', getLegacyStatus);

// Listar compras realizadas
router.get('/my', listLegacyPurchases);

export default router;