"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const lyricsController_1 = require("../controllers/lyricsController");
const router = express_1.default.Router();
// Rutas públicas (para visualizar letras)
router.get('/track/:trackId', lyricsController_1.getLyrics);
router.get('/track/:trackId/export', lyricsController_1.exportLyrics);
// Rutas protegidas (requieren autenticación)
router.use(auth_1.authenticate);
router.post('/upload', lyricsController_1.uploadLyrics);
router.post('/track/:trackId/plain', lyricsController_1.uploadPlainLyrics);
router.delete('/track/:trackId', lyricsController_1.deleteLyrics);
exports.default = router;
