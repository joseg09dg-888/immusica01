import express from 'express';
import { authenticate } from '../middleware/auth';
import { generateReel } from '../controllers/promoController';

const router = express.Router();

router.use(authenticate);

router.post('/reel', generateReel);

export default router;
