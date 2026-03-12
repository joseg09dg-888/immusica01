import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  generatePromoCard,
  generateSimpleCard
} from '../controllers/promoController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Generar tarjeta promocional para un track existente
router.post('/generate', generatePromoCard);

// Generar tarjeta simple con texto personalizado
router.post('/simple', generateSimpleCard);

export default router;