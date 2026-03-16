import { Router } from 'express';
import * as wompiController from '../controllers/wompiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public webhook endpoint (No auth required, Wompi calls this)
router.post('/webhook', wompiController.handleWebhook);

// Protected endpoints for the frontend
router.get('/plans', wompiController.getPlans);
router.post('/create-payment', authenticate, wompiController.createPaymentSession);
router.get('/transaction/:id', authenticate, wompiController.checkTransactionStatus);
router.get('/history', authenticate, wompiController.getTransactionHistory);
router.get('/subscriptions', authenticate, wompiController.getSubscriptionsByEmail);

export default router;
