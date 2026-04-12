import { Router } from 'express';
import {
  addSplit,
  getSplits,
  deleteSplit,
  acceptSplit,
  rejectSplit,
  getPendingSplits,
  getAllSplitsByArtist
} from '../controllers/splitController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/splits', authenticate, getAllSplitsByArtist);
router.post('/tracks/:trackId/splits', addSplit);
router.get('/tracks/:trackId/splits', getSplits);
router.get('/tracks/:trackId/splits/pending', getPendingSplits);
router.delete('/splits/:splitId', deleteSplit);
router.get('/splits/accept/:token', acceptSplit);
router.get('/splits/reject/:token', rejectSplit);

export default router;