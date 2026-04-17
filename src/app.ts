import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

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
import legacyRoutes from './routes/legacyRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import openClawRoutes from './routes/openClawRoutes';
import promoRoutes from './routes/promoRoutes';
import labelRoutes from './routes/labelRoutes';

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

// WebSocket para OpenClaw
const wss = new WebSocketServer({ server, path: '/gateway' });

wss.on('connection', (ws, req) => {
  console.log('🔌 OpenClaw conectado a /gateway');
  ws.send(JSON.stringify({ type: 'welcome', message: 'Conectado a IM Music Gateway' }));

  ws.on('message', (data) => {
    console.log('Mensaje de OpenClaw:', data.toString());
  });

  ws.on('close', () => {
    console.log('OpenClaw desconectado de /gateway');
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket de OpenClaw:', error);
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    }
  }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://immusic.co', 'https://www.immusic.co']
    : ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Webhook de Wompi — raw body para verificación de firma
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

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de autenticación, intenta más tarde' }
});
app.use('/api', limiter);

// ========== RUTAS ==========
app.use('/api/auth', authLimiter, authRoutes);
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
app.use('/api/community', chatRoutes);  // alias for community page
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
app.use('/api/legacy', legacyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/openclaw', openClawRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/labels', labelRoutes);

// Socket.io chat
io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado al chat');
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado del chat');
  });
});

export { io };

// Health check — actualizado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IM Music API funcionando',
    timestamp: new Date().toISOString(),
    integraciones: {
      gemini:     process.env.GEMINI_API_KEY ? '✅' : '❌ falta GEMINI_API_KEY',
      wompi:      process.env.WOMPI_PUBLIC_KEY ? '✅' : '❌ falta WOMPI_PUBLIC_KEY',
      cloudinary: (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'pon_aqui_tu_cloud_name') ? '✅' : '⚠️ pendiente',
      spotify:    process.env.SPOTIFY_CLIENT_ID ? '✅' : '❌ falta SPOTIFY_CLIENT_ID',
    }
  });
});

// Iniciar servidor y jobs
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ IM Music API corriendo en http://localhost:${PORT}`);
  console.log(`   Gemini:     ${process.env.GEMINI_API_KEY ? '✅ configurado' : '❌ falta GEMINI_API_KEY'}`);
  console.log(`   Wompi:      ${process.env.WOMPI_PUBLIC_KEY ? '✅ configurado' : '❌ falta WOMPI_PUBLIC_KEY'}`);
  console.log(`   Cloudinary: ${(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'pon_aqui_tu_cloud_name') ? '✅ configurado' : '⚠️  pendiente — sube credenciales al .env'}`);
  console.log(`   Spotify:    ${process.env.SPOTIFY_CLIENT_ID ? '✅ configurado' : '❌ falta SPOTIFY_CLIENT_ID'}`);
  startReleasePublisher();
  startStoreMaximizer();
});