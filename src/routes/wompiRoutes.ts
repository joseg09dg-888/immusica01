import { Router } from 'express';
import { 
  getPlans, 
  createPayment, 
  wompiWebhook, 
  checkTransactionStatus,
  getUserSubscriptions 
} from '../controllers/wompiController';

const router = Router();

router.get('/plans', getPlans);
router.post('/create-payment', createPayment);
router.post('/webhook', wompiWebhook);
router.get('/transaction/:transactionId', checkTransactionStatus);
router.get('/subscriptions', getUserSubscriptions);

export default router;