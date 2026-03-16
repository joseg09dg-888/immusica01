import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as LyricsController from '../controllers/lyricsController';

const router = Router();

router.get('/:trackId', authenticate, LyricsController.getLyrics);
router.post('/:trackId', authenticate, LyricsController.uploadLyrics);
router.delete('/:id', authenticate, LyricsController.deleteLyrics);

export default router;
