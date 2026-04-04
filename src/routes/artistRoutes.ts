import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMyArtists, createArtist, getArtistById, updateArtist, deleteArtist, getArtistLimit } from '../controllers/artistController';

const router = express.Router();
router.use(authenticate);
router.get('/', getMyArtists);
router.post('/', createArtist);
router.get('/limit', getArtistLimit);
router.get('/:id', getArtistById);
router.put('/:id', updateArtist);
router.delete('/:id', deleteArtist);

export default router;
