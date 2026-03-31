"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const openClawController_1 = require("../controllers/openClawController");
const router = express_1.default.Router();
// ========== RUTAS PÚBLICAS (para recibir mensajes) ==========
router.post('/inbox/receive', openClawController_1.receiveInboxMessage);
// ========== RUTAS PROTEGIDAS (solo AI_OPERATOR) ==========
router.use(auth_1.authenticate);
// Buzón de entrada
router.get('/inbox', openClawController_1.getInboxMessages);
router.put('/inbox/:id/process', openClawController_1.markInboxMessageAsProcessed);
// Logs y monitoreo
router.get('/logs', openClawController_1.getSystemLogs);
router.get('/resources', openClawController_1.getResourceStatus);
// GitHub
router.post('/github/branch', openClawController_1.createGitHubBranch);
// Ngrok
router.post('/ngrok/test', openClawController_1.startNgrokTest);
// Configuración y emergencia
router.get('/config', openClawController_1.getAgentConfig);
router.post('/emergency', openClawController_1.setEmergencyStop);
// Tareas
router.get('/tasks', openClawController_1.getPendingTasks);
router.put('/tasks/:id', openClawController_1.updateTaskStatus);
// Notificaciones
router.post('/notify', openClawController_1.sendNotification);
exports.default = router;
