"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = require("ws"); // <-- Importar WebSocketServer
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const artistRoutes_1 = __importDefault(require("./routes/artistRoutes"));
const trackRoutes_1 = __importDefault(require("./routes/trackRoutes"));
const campaignRoutes_1 = __importDefault(require("./routes/campaignRoutes"));
const royaltyRoutes_1 = __importDefault(require("./routes/royaltyRoutes"));
const marketingRoutes_1 = __importDefault(require("./routes/marketingRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const legalAgentRoutes_1 = __importDefault(require("./routes/legalAgentRoutes"));
const marketplaceRoutes_1 = __importDefault(require("./routes/marketplaceRoutes"));
const financingRoutes_1 = __importDefault(require("./routes/financingRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const moodRoutes_1 = __importDefault(require("./routes/moodRoutes"));
const wompiRoutes_1 = __importDefault(require("./routes/wompiRoutes"));
const splitRoutes_1 = __importDefault(require("./routes/splitRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const landingRoutes_1 = __importDefault(require("./routes/landingRoutes"));
const releaseRoutes_1 = __importDefault(require("./routes/releaseRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const playlistRoutes_1 = __importDefault(require("./routes/playlistRoutes"));
const videoRoutes_1 = __importDefault(require("./routes/videoRoutes"));
const lyricsRoutes_1 = __importDefault(require("./routes/lyricsRoutes"));
const publishingRoutes_1 = __importDefault(require("./routes/publishingRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const spotlightRoutes_1 = __importDefault(require("./routes/spotlightRoutes"));
const vaultRoutes_1 = __importDefault(require("./routes/vaultRoutes"));
const riaaRoutes_1 = __importDefault(require("./routes/riaaRoutes"));
const storeRoutes_1 = __importDefault(require("./routes/storeRoutes"));
const youtubeRoutes_1 = __importDefault(require("./routes/youtubeRoutes"));
const legacyRoutes_1 = __importDefault(require("./routes/legacyRoutes"));
const feedbackRoutes_1 = __importDefault(require("./routes/feedbackRoutes"));
const openClawRoutes_1 = __importDefault(require("./routes/openClawRoutes"));
// Importar jobs automáticos
const releasePublisher_1 = require("./jobs/releasePublisher");
const storeMaximizerJob_1 = require("./jobs/storeMaximizerJob");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// ========== NUEVO WEBSOCKET PARA OPENCLAW ==========
const wss = new ws_1.WebSocketServer({ server, path: '/gateway' });
wss.on('connection', (ws, req) => {
    console.log('🔌 OpenClaw conectado a /gateway');
    // Opcional: enviar un mensaje de bienvenida
    ws.send(JSON.stringify({ type: 'welcome', message: 'Conectado a IM Music Gateway' }));
    ws.on('message', (data) => {
        console.log('Mensaje de OpenClaw:', data.toString());
        // Aquí puedes procesar los mensajes según sea necesario
        // Por ejemplo, podrías responder con un pong o manejar comandos
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
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)());
// Webhook de Wompi (debe ser raw)
app.post('/api/wompi/webhook', express_1.default.raw({ type: 'application/json' }), (req, res) => {
    try {
        const rawBody = req.body;
        const jsonBody = JSON.parse(rawBody.toString('utf8'));
        req.parsedBody = jsonBody;
        Promise.resolve().then(() => __importStar(require('./controllers/wompiController'))).then(({ wompiWebhook }) => {
            req.body = jsonBody;
            wompiWebhook(req, res);
        });
    }
    catch (error) {
        console.error('Error parsing webhook body:', error);
        res.status(400).send('Invalid JSON');
    }
});
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api', limiter);
// ========== RUTAS ==========
app.use('/api/auth', authRoutes_1.default);
app.use('/api/artists', artistRoutes_1.default);
app.use('/api/tracks', trackRoutes_1.default);
app.use('/api/campaigns', campaignRoutes_1.default);
app.use('/api/royalties', royaltyRoutes_1.default);
app.use('/api/marketing', marketingRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/legal-agent', legalAgentRoutes_1.default);
app.use('/api/marketplace', marketplaceRoutes_1.default);
app.use('/api/financing', financingRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/mood', moodRoutes_1.default);
app.use('/api/wompi', wompiRoutes_1.default);
app.use('/api', splitRoutes_1.default);
app.use('/api/stats', statsRoutes_1.default);
app.use('/api/landing', landingRoutes_1.default);
app.use('/api/releases', releaseRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/playlists', playlistRoutes_1.default);
app.use('/api/videos', videoRoutes_1.default);
app.use('/api/lyrics', lyricsRoutes_1.default);
app.use('/api/publishing', publishingRoutes_1.default);
app.use('/api/team', teamRoutes_1.default);
app.use('/api/spotlight', spotlightRoutes_1.default);
app.use('/api/vault', vaultRoutes_1.default);
app.use('/api/riaa', riaaRoutes_1.default);
app.use('/api/store', storeRoutes_1.default);
app.use('/api/youtube', youtubeRoutes_1.default);
app.use('/api/legacy', legacyRoutes_1.default);
app.use('/api/feedback', feedbackRoutes_1.default);
app.use('/api/openclaw', openClawRoutes_1.default);
// Configuración de Socket.io (para el chat)
io.on('connection', (socket) => {
    console.log('🔌 Nuevo cliente conectado al chat');
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado del chat');
    });
});
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});
// Iniciar servidor y jobs
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    (0, releasePublisher_1.startReleasePublisher)();
    (0, storeMaximizerJob_1.startStoreMaximizer)();
});
