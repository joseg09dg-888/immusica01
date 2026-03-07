import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  listarBeats,
  verBeat,
  subirBeat,
  comprarBeat,
  valorarBeat,
  misBeats,
  misCompras,
  estadisticasUsuario,
  rankings
} from '../controllers/marketplaceController';

const router = express.Router();

// Rutas públicas
router.get('/beats', listarBeats);
router.get('/beats/:id', verBeat);
router.get('/rankings', rankings);

// Rutas protegidas (requieren autenticación)
router.post('/beats', authenticate, subirBeat);
router.post('/beats/:id/comprar', authenticate, comprarBeat);
router.post('/beats/:id/valorar', authenticate, valorarBeat);
router.get('/mis-beats', authenticate, misBeats);
router.get('/mis-compras', authenticate, misCompras);
router.get('/mis-estadisticas', authenticate, estadisticasUsuario);

export default router;