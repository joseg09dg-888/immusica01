import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPreguntas,
  procesarTest,
  generarBrandingSensorial,
  generarMercadoObjetivo,
  generarPlanContenidos,
  getMiBranding,
  generateDescription,
  generateHashtags,
  generateSocialPost
} from '../controllers/marketingController';

console.log('🔥 marketingRoutes.ts se ha cargado correctamente');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de branding (existentes)
router.get('/preguntas', getPreguntas);
router.post('/test', procesarTest);
router.post('/generar-branding', generarBrandingSensorial);
router.post('/generar-mercado', generarMercadoObjetivo);
router.post('/generar-plan', generarPlanContenidos);
router.get('/mi-branding', getMiBranding);

// Nuevas rutas de promoción con IA
router.post('/generate-description', generateDescription);
router.post('/generate-hashtags', generateHashtags);
router.post('/generate-social-post', generateSocialPost);

export default router;