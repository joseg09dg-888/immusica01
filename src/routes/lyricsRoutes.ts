import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadLyrics,
  uploadPlainLyrics,
  getLyrics,
  deleteLyrics,
  exportLyrics
} from '../controllers/lyricsController';

const router = express.Router();

// Rutas públicas (para visualizar letras)
router.get('/', (req, res) => res.json([]));  // root: empty list (no user-specific context yet)
router.get('/track/:trackId', getLyrics);
router.get('/track/:trackId/export', exportLyrics);
// Frontend compat: GET /lyrics/:trackId
router.get('/:trackId', getLyrics);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);
// Frontend compat: POST /lyrics with body { track_id, lyrics }
router.post('/', (req, res, next) => {
  if (!req.body.trackId && req.body.track_id) {
    req.body.trackId = req.body.track_id;
  }
  return uploadPlainLyrics(req as any, res);
});
router.post('/upload', uploadLyrics);
router.post('/track/:trackId/plain', uploadPlainLyrics);
router.delete('/track/:trackId', deleteLyrics);

export default router;