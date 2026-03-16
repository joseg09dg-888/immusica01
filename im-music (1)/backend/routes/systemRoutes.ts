import express from 'express';
import { getSystemInfo, pitchToPlaylist, getMyPitches } from '../controllers/systemController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/info', authenticate, getSystemInfo);
router.post('/pitch', authenticate, pitchToPlaylist);
router.get('/pitches', authenticate, getMyPitches);

export default router;
