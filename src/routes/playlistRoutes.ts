import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getMoods
} from '../controllers/playlistController';

const router = express.Router();

// Rutas públicas
router.get('/', getPlaylists);
router.get('/moods', getMoods);
router.get('/:id', getPlaylistById);

// Rutas protegidas
router.post('/', authenticate, createPlaylist);
router.put('/:id', authenticate, updatePlaylist);
router.delete('/:id', authenticate, deletePlaylist);

export default router;