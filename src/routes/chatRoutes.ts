import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getRecentMessages,
  reportMessage
} from '../controllers/chatController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post('/send', sendMessage);
router.get('/recent', getRecentMessages);
router.post('/report/:messageId', reportMessage);

export default router;