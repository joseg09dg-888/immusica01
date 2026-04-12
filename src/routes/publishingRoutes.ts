import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  createComposer,
  getComposers,
  createComposition,
  assignCompositionSplits,
  registerWithPRO,
  addPublishingRoyalty,
  getPublishingSummary,
  getCompositions
} from '../controllers/publishingController';

const router = express.Router();

router.use(authenticate);

// Root: returns compositions array for frontend compatibility
router.get('/', getCompositions);
router.post('/composers', createComposer);
router.get('/composers', getComposers);
router.post('/compositions', createComposition);
router.post('/compositions/:compositionId/splits', assignCompositionSplits);
router.post('/compositions/:compositionId/register-pro', registerWithPRO);
router.post('/royalties', addPublishingRoyalty);
router.get('/summary', getPublishingSummary);

export default router;