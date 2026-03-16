import express from 'express';
import { authenticate } from '../middleware/auth';
import * as splitController from '../controllers/splitController';

const router = express.Router();

// Public routes for accepting/rejecting via email links
router.get('/accept/:token', splitController.acceptSplit);
router.get('/reject/:token', splitController.rejectSplit);

// Protected routes
router.use(authenticate);
router.post('/tracks/:trackId/splits', splitController.createSplit);
router.get('/tracks/:trackId/splits', splitController.getTrackSplits);
router.get('/tracks/:trackId/splits/pending', splitController.getPendingSplits);
router.delete('/:splitId', splitController.deleteSplit);

export default router;
