import express from 'express';
import { authenticate } from '../middleware/auth';
import { chat, getModels } from '../controllers/aiController';

const router = express.Router();
router.use(authenticate);
router.post('/chat', chat);
router.get('/models', getModels);

export default router;
