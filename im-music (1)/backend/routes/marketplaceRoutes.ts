import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplaceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/beats', authenticate, marketplaceController.getBeats);
router.post('/buy', authenticate, marketplaceController.buyBeat);

export default router;
