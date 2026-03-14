import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  receiveInboxMessage,
  getInboxMessages,
  markInboxMessageAsProcessed,
  getSystemLogs,
  getResourceStatus,
  createGitHubBranch,
  startNgrokTest,
  getAgentConfig,
  setEmergencyStop,
  getPendingTasks,
  updateTaskStatus,
  sendNotification
} from '../controllers/openClawController';

const router = express.Router();

// ========== RUTAS PÚBLICAS (para recibir mensajes) ==========
router.post('/inbox/receive', receiveInboxMessage);

// ========== RUTAS PROTEGIDAS (solo AI_OPERATOR) ==========
router.use(authenticate);

// Buzón de entrada
router.get('/inbox', getInboxMessages);
router.put('/inbox/:id/process', markInboxMessageAsProcessed);

// Logs y monitoreo
router.get('/logs', getSystemLogs);
router.get('/resources', getResourceStatus);

// GitHub
router.post('/github/branch', createGitHubBranch);

// Ngrok
router.post('/ngrok/test', startNgrokTest);

// Configuración y emergencia
router.get('/config', getAgentConfig);
router.post('/emergency', setEmergencyStop);

// Tareas
router.get('/tasks', getPendingTasks);
router.put('/tasks/:id', updateTaskStatus);

// Notificaciones
router.post('/notify', sendNotification);

export default router;