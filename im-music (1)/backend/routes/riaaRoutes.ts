import express from 'express';
import { authenticate } from '../middleware/auth';
import { getCertifications } from '../controllers/riaaController';

const router = express.Router();

router.use(authenticate);

router.get('/', getCertifications);

export default router;
