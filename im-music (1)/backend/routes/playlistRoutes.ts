import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as PlaylistController from '../controllers/playlistController';

const router = Router();

router.get('/', authenticate, PlaylistController.getPlaylists);
router.post('/', authenticate, PlaylistController.createPlaylist);
router.put('/:id', authenticate, PlaylistController.updatePlaylist);
router.delete('/:id', authenticate, PlaylistController.deletePlaylist);
router.get('/moods', authenticate, PlaylistController.getMoods);

export default router;
