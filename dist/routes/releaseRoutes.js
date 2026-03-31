"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const releaseController_1 = require("../controllers/releaseController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Programar lanzamiento
router.post('/track/:trackId/schedule', releaseController_1.scheduleRelease);
// Cancelar programación
router.delete('/track/:trackId/schedule', releaseController_1.cancelScheduled);
// Obtener info de un track
router.get('/track/:trackId', releaseController_1.getReleaseInfo);
// Listar todos los tracks programados del artista
router.get('/scheduled', releaseController_1.getScheduledTracks);
exports.default = router;
