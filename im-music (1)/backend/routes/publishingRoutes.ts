import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as PublishingController from '../controllers/publishingController';

const router = Router();

router.get('/compositions', authenticate, PublishingController.getCompositions);
router.post('/compositions', authenticate, PublishingController.createComposition);
router.get('/royalties', authenticate, PublishingController.getPublishingRoyalties);
router.post('/register', authenticate, PublishingController.registerComposition);
router.get('/summary', authenticate, PublishingController.getPublishingSummary);

export default router;
