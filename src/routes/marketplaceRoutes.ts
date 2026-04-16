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
  rankings,
  getCommissions
} from '../controllers/marketplaceController';

import { Request, Response } from 'express';

const router = express.Router();

// Rutas públicas
router.get('/beats', listarBeats);
router.get('/beats/:id', verBeat);
router.get('/rankings', rankings);

// Alias: /hot → top 10 más vendidos (array plano)
router.get('/hot', async (req: Request, res: Response) => {
  try {
    const fakeRes = {
      _data: null as any,
      json(data: any) { this._data = data; },
      status(_code: number) { return this; }
    };
    await rankings(req, fakeRes as any);
    const data = fakeRes._data;
    res.json(Array.isArray(data?.mas_comprados) ? data.mas_comprados : []);
  } catch { res.json([]); }
});

// Alias: /top-rated → top 10 mejor puntuados (array plano)
router.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const fakeRes = {
      _data: null as any,
      json(data: any) { this._data = data; },
      status(_code: number) { return this; }
    };
    await rankings(req, fakeRes as any);
    const data = fakeRes._data;
    res.json(Array.isArray(data?.mejor_puntuados) ? data.mejor_puntuados : []);
  } catch { res.json([]); }
});

// Rutas protegidas (requieren autenticación)
router.post('/beats', authenticate, subirBeat);
router.post('/beats/:id/comprar', authenticate, comprarBeat);
router.post('/beats/:id/valorar', authenticate, valorarBeat);
router.get('/my-beats', authenticate, misBeats);
router.get('/mis-beats', authenticate, misBeats);
router.get('/mis-compras', authenticate, misCompras);
router.get('/mis-estadisticas', authenticate, estadisticasUsuario);
router.get('/admin/commissions', authenticate, getCommissions);

export default router;