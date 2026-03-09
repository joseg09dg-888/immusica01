import { Router } from 'express';
import { getPlans, createSubscription, stripeWebhook } from '../controllers/stripeController';

const router = Router();

router.get('/plans', getPlans);
router.post('/create-subscription', createSubscription);
router.post('/webhook', stripeWebhook);

export default router;