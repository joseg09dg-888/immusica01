import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMyTracks, createTrack, getTrackById, updateTrack, deleteTrack } from '../controllers/trackController';
import { validate, schemas } from '../middleware/validate';

const router = express.Router();
router.use(authenticate);
router.get('/', getMyTracks);
router.post('/', validate(schemas.createTrack), createTrack);
router.get('/:id', getTrackById);
router.put('/:id', validate(schemas.updateTrack), updateTrack);
router.delete('/:id', deleteTrack);

export default router;
