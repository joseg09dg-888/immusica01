import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPreguntas,
  procesarTest,
  generarBrandingSensorial,
  generarMercadoObjetivo,
  generarPlanContenidos,
  getMiBranding
} from '../controllers/marketingController';

const router = express.Router();

router.use(authenticate);

router.get('/preguntas', getPreguntas);
router.post('/test', procesarTest);
router.post('/generar-branding', generarBrandingSensorial);
router.post('/generar-mercado', generarMercadoObjetivo);
router.post('/generar-plan', generarPlanContenidos);
router.get('/mi-branding', getMiBranding);

export default router;
