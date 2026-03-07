import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importar rutas existentes
import authRoutes from './routes/authRoutes';
import artistRoutes from './routes/artistRoutes';
import trackRoutes from './routes/trackRoutes';
import campaignRoutes from './routes/campaignRoutes';
import royaltyRoutes from './routes/royaltyRoutes';
import marketingRoutes from './routes/marketingRoutes';
import aiRoutes from './routes/aiRoutes';
import legalAgentRoutes from './routes/legalAgentRoutes';
// Nueva ruta para el marketplace
import marketplaceRoutes from './routes/marketplaceRoutes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middlewares globales
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (para los uploads de beats)
app.use('/uploads', express.static('uploads'));

// Limitador de peticiones (opcional)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api', limiter);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/royalties', royaltyRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/legal-agent', legalAgentRoutes);
app.use('/api/marketplace', marketplaceRoutes); // <--- NUEVA RUTA

// Ruta de salud (pública)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});