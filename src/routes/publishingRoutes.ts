import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createComposer,
  getComposers,
  createComposition,
  assignCompositionSplits,
  registerWithPRO,
  addPublishingRoyalty,
  getPublishingSummary
} from '../controllers/publishingController';

const router = express.Router();

router.use(authenticate);

router.post('/composers', createComposer);
router.get('/composers', getComposers);
router.post('/compositions', createComposition);
router.post('/compositions/:compositionId/splits', assignCompositionSplits);
router.post('/compositions/:compositionId/register-pro', registerWithPRO);
router.post('/royalties', addPublishingRoyalty);
router.get('/summary', getPublishingSummary);

export default router;