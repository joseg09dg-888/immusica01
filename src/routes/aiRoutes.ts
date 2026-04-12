import express from 'express';
import { authenticate } from '../middleware/auth';
import { chat, getModels, marketIntel } from '../controllers/aiController';

const router = express.Router();
router.use(authenticate);
router.post('/chat', chat);
router.get('/models', getModels);
router.post('/market-intel', marketIntel);

export default router;
