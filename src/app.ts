import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import artistRoutes from './routes/artistRoutes';
import trackRoutes from './routes/trackRoutes';
import campaignRoutes from './routes/campaignRoutes';
import royaltyRoutes from './routes/royaltyRoutes';
import marketingRoutes from './routes/marketingRoutes';
import aiRoutes from './routes/aiRoutes';
import legalAgentRoutes from './routes/legalAgentRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import financingRoutes from './routes/financingRoutes';
import uploadRoutes from './routes/uploadRoutes';
import moodRoutes from './routes/moodRoutes';
import wompiRoutes from './routes/wompiRoutes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Webhook de Wompi (debe ser raw)
app.post('/api/wompi/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // req.body es un Buffer
  try {
    const rawBody = req.body as Buffer;
    const jsonBody = JSON.parse(rawBody.toString('utf8'));
    // Crear un nuevo request con el body parseado
    (req as any).parsedBody = jsonBody;
    // Llamar al controlador
    import('./controllers/wompiController').then(({ wompiWebhook }) => {
      req.body = jsonBody; // reemplazar para que el controlador lo vea
      wompiWebhook(req, res);
    });
  } catch (error) {
    console.error('Error parsing webhook body:', error);
    res.status(400).send('Invalid JSON');
  }
});

app.use(express.json());

app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/royalties', royaltyRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/legal-agent', legalAgentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/wompi', wompiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});