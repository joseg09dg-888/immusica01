import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCertificationStatus,
  getCertificationHistory
} from '../controllers/riaaController';

const router = express.Router();

router.use(authenticate);

router.get('/status', getCertificationStatus);
router.get('/history/:artistId', getCertificationHistory);

export default router;