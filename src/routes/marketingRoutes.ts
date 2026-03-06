import express from 'express';
import {
  getPreguntas,
  procesarTest,
  generarBrandingSensorial,
  generarMercadoObjetivo,
  generarPlanContenidos,
  getMiBranding
} from '../controllers/marketingController';

console.log('🔥 marketingRoutes.ts se ha cargado correctamente');

const router = express.Router();

// Rutas
router.get('/preguntas', getPreguntas);
router.post('/test', procesarTest);
router.post('/generar-branding', generarBrandingSensorial);
router.post('/generar-mercado', generarMercadoObjetivo);
router.post('/generar-plan', generarPlanContenidos);
router.get('/mi-branding', getMiBranding);

export default router;