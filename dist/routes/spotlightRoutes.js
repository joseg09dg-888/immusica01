"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const spotlightController_1 = require("../controllers/spotlightController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Enviar track a playlist
router.post('/submit', spotlightController_1.submitToPlaylist);
// Listar mis envíos
router.get('/submissions', spotlightController_1.getMySubmissions);
// Obtener detalle de un envío
router.get('/submissions/:id', spotlightController_1.getSubmissionById);
exports.default = router;
