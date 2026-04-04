import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMyTracks, createTrack, getTrackById, updateTrack, deleteTrack } from '../controllers/trackController';

const router = express.Router();
router.use(authenticate);
router.get('/', getMyTracks);
router.post('/', createTrack);
router.get('/:id', getTrackById);
router.put('/:id', updateTrack);
router.delete('/:id', deleteTrack);

export default router;
