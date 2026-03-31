import express from 'express';
import { authenticate } from '../middleware/auth';
import { createPaymentIntent, getUserSubscriptions } from '../controllers/stripeController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear intención de pago
router.post('/create-payment-intent', createPaymentIntent);

// Obtener suscripciones del usuario
router.get('/subscriptions', getUserSubscriptions);

export default router;