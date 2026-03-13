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
router.get('/track/:trackId', getLyrics);
router.get('/track/:trackId/export', exportLyrics);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);
router.post('/upload', uploadLyrics);
router.post('/track/:trackId/plain', uploadPlainLyrics);
router.delete('/track/:trackId', deleteLyrics);

export default router;