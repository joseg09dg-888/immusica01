import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from "vite";

import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import artistRoutes from './routes/artistRoutes';
import royaltyRoutes from './routes/royaltyRoutes';
import marketingRoutes from './routes/marketingRoutes';
import facebookAdsRoutes from './routes/facebookAdsRoutes';
import trackRoutes from './routes/trackRoutes';
import legalRoutes from './routes/legalRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import financingRoutes from './routes/financingRoutes';
import bulkUploadRoutes from './routes/bulkUploadRoutes';
import moodRoutes from './routes/moodRoutes';
import wompiRoutes from './routes/wompiRoutes';
import splitRoutes from './routes/splitRoutes';
import statsRoutes from './routes/statsRoutes';
import systemRoutes from './routes/systemRoutes';
import releaseRoutes from './routes/releaseRoutes';
import vaultRoutes from './routes/vaultRoutes';
import riaaRoutes from './routes/riaaRoutes';
import promoRoutes from './routes/promoRoutes';
import youtubeRoutes from './routes/youtubeRoutes';
import publishingRoutes from './routes/publishingRoutes';
import videoRoutes from './routes/videoRoutes';
import lyricsRoutes from './routes/lyricsRoutes';
import playlistRoutes from './routes/playlistRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import { upload } from './middleware/upload';
import { authenticate } from './middleware/auth';
import db from './config/database';
import { initFeedbackTable } from './models/Feedback';

import { runJobs } from './utils/jobs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start background jobs
runJobs();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize tables
  initFeedbackTable();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Demasiadas peticiones, intenta más tarde' }
  });
  app.use('/api', limiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/artists', artistRoutes);
  app.use('/api/royalties', royaltyRoutes);
  app.use('/api/marketing', marketingRoutes);
  app.use('/api/facebook-ads', facebookAdsRoutes);
  app.use('/api/tracks', trackRoutes);
  app.use('/api/legal-agent', legalRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/financing', financingRoutes);
  app.use('/api/upload', bulkUploadRoutes);
  app.use('/api/mood', moodRoutes);
  app.use('/api/wompi', wompiRoutes);
  app.use('/api/splits', splitRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/releases', releaseRoutes);
  app.use('/api/vault', vaultRoutes);
  app.use('/api/riaa', riaaRoutes);
  app.use('/api/promo', promoRoutes);
  app.use('/api/youtube', youtubeRoutes);
  app.use('/api/publishing', publishingRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/lyrics', lyricsRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/feedback', feedbackRoutes);

  // Socket.io Community Chat
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_community', () => {
      socket.join('community_room');
    });

    socket.on('send_message', (data) => {
      // Basic moderation simulation
      const isModerated = data.message.toLowerCase().includes('spam');
      db.prepare('INSERT INTO chat_messages (user_id, message, is_moderated) VALUES (?, ?, ?)').run(data.userId, data.message, isModerated ? 1 : 0);
      
      if (!isModerated) {
        io.to('community_room').emit('receive_message', data);
      } else {
        socket.emit('message_blocked', { reason: 'Spam detected' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  app.post('/api/upload', authenticate, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path, public_id: req.file.filename });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist", "index.html"));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
