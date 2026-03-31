"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const youtubeController_1 = require("../controllers/youtubeController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Registrar track en Content ID
router.post('/register', youtubeController_1.registerInYouTube);
// Obtener estado de un track
router.get('/status/:trackId', youtubeController_1.getYouTubeStatus);
// Listar todos los registros del artista
router.get('/my', youtubeController_1.listMyYouTubeRegistrations);
exports.default = router;
