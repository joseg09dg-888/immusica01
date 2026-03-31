"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const statsController_1 = require("../controllers/statsController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Subir CSV de estadísticas
router.post('/upload', statsController_1.uploadDailyStats);
// Obtener estadísticas de un track específico
router.get('/track/:trackId', statsController_1.getTrackStats);
// Obtener resumen general del artista
router.get('/summary', statsController_1.getArtistSummary);
// Obtener lista de tracks del artista (para selects)
router.get('/tracks', statsController_1.getArtistTracks);
exports.default = router;
