import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getScheduledReleases,
  scheduleRelease,
  cancelScheduledRelease
} from '../controllers/trackController';

const router = express.Router();

router.use(authenticate);

router.get('/scheduled', getScheduledReleases);
router.post('/schedule', scheduleRelease);
router.post('/schedule/:id/cancel', cancelScheduledRelease);

export default router;
