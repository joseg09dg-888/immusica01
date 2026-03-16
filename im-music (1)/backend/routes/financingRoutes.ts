import { Router } from 'express';
import * as financingController from '../controllers/financingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/mi-elegibilidad', authenticate, financingController.checkEligibility);
router.post('/solicitar', authenticate, financingController.solicitarAdelanto);

export default router;
