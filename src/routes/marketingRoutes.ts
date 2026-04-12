import express from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
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

// Content Plan payment check: free for PRO, $15.000 COP Wompi for INDIE
router.post('/content-plan/purchase', async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    const sub = await db.prepare(
      `SELECT plan_id FROM subscriptions WHERE user_email = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`
    ).get(user.email) as { plan_id: string } | undefined;
    const plan = sub?.plan_id || 'free';

    if (plan === 'pro') {
      return res.json({ access: 'free', plan });
    }

    if (plan === 'indie') {
      const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
      const reference = `CP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      const checkoutUrl = new URL('https://checkout.wompi.co/p/');
      checkoutUrl.searchParams.append('public-key', WOMPI_PUBLIC_KEY);
      checkoutUrl.searchParams.append('amount-in-cents', '1500000'); // $15.000 COP
      checkoutUrl.searchParams.append('currency', 'COP');
      checkoutUrl.searchParams.append('reference', reference);
      const redirectBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      checkoutUrl.searchParams.append('redirect-url', `${redirectBase}/?cp_ref=${reference}`);
      return res.json({ access: 'paid', paymentUrl: checkoutUrl.toString(), reference, amountCOP: 15000 });
    }

    return res.status(403).json({
      error: 'Necesitas el plan Indie o Pro para acceder al Plan de Contenido IA',
      requiredPlan: 'indie',
      currentPlan: plan,
      upgradeUrl: '/settings'
    });
  } catch (error) {
    console.error('Error en content-plan/purchase:', error);
    res.status(500).json({ error: 'Error al procesar' });
  }
});

export default router;