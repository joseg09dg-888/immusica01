import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLandingPage,
  getLandingPage,
  captureLead,
  getMyLandingPages,
  deleteLandingPage
} from '../controllers/landingController';

const router = express.Router();

// Rutas públicas
router.get('/:slug', getLandingPage);
router.post('/:slug/lead', captureLead);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);
router.post('/', createLandingPage);
router.get('/my/list', getMyLandingPages);
router.delete('/:id', deleteLandingPage);

export default router;