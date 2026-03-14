import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
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
import splitRoutes from './routes/splitRoutes';
import statsRoutes from './routes/statsRoutes';
import landingRoutes from './routes/landingRoutes';
import releaseRoutes from './routes/releaseRoutes';
import chatRoutes from './routes/chatRoutes';
import playlistRoutes from './routes/playlistRoutes';
import videoRoutes from './routes/videoRoutes';
import lyricsRoutes from './routes/lyricsRoutes';
import publishingRoutes from './routes/publishingRoutes';
import teamRoutes from './routes/teamRoutes';
import spotlightRoutes from './routes/spotlightRoutes';
import vaultRoutes from './routes/vaultRoutes';
import riaaRoutes from './routes/riaaRoutes';
import storeRoutes from './routes/storeRoutes';
import youtubeRoutes from './routes/youtubeRoutes';

// Importar los jobs automáticos
import { startReleasePublisher } from './jobs/releasePublisher';
import { startStoreMaximizer } from './jobs/storeMaximizerJob';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Webhook de Wompi (debe ser raw)
app.post('/api/wompi/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const rawBody = req.body as Buffer;
    const jsonBody = JSON.parse(rawBody.toString('utf8'));
    (req as any).parsedBody = jsonBody;
    import('./controllers/wompiController').then(({ wompiWebhook }) => {
      req.body = jsonBody;
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

// ========== RUTAS ==========
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
app.use('/api', splitRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/spotlight', spotlightRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/riaa', riaaRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/youtube', youtubeRoutes);

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado al chat');
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado del chat');
  });
});

export { io };

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Iniciar servidor y jobs
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  startReleasePublisher();
  startStoreMaximizer();
});