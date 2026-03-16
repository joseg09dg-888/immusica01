import express from 'express';
import { authenticate } from '../middleware/auth';
import { registerContentId, getContentIds } from '../controllers/youtubeController';

const router = express.Router();

router.use(authenticate);

router.post('/register', registerContentId);
router.get('/registrations', getContentIds);

export default router;
