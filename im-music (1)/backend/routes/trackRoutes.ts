import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getMyTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  uploadLyrics,
  getLyrics,
  getScheduledReleases,
  scheduleRelease,
  cancelScheduledRelease,
  toggleAutoDistribute,
  leaveALegacy
} from '../controllers/trackController';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyTracks);
router.post('/', 
  [
    body('title').notEmpty().trim().escape(),
    body('artist_id').isNumeric()
  ],
  upload.single('audio'), 
  createTrack
);
router.put('/:id', upload.single('audio'), updateTrack);
router.delete('/:id', deleteTrack);

// Lyrics
router.post('/:id/lyrics', uploadLyrics);
router.get('/:id/lyrics', getLyrics);

// Scheduled Releases
router.get('/scheduled', getScheduledReleases);
router.post('/scheduled', scheduleRelease);
router.post('/scheduled/:id/cancel', cancelScheduledRelease);

// New Features
router.post('/:id/auto-distribute', toggleAutoDistribute);
router.post('/:id/leave-a-legacy', leaveALegacy);

export default router;
