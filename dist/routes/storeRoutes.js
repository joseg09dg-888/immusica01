"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const storeController_1 = require("../controllers/storeController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Activar distribución automática para un track
router.post('/track/:trackId/activate', storeController_1.activateAutoDistribute);
// Desactivar distribución automática
router.post('/track/:trackId/deactivate', storeController_1.deactivateAutoDistribute);
// Obtener distribuciones de un track
router.get('/track/:trackId', storeController_1.getDistributions);
// Forzar distribución ahora (opcional, pruebas)
router.post('/track/:trackId/force', storeController_1.forceDistribute);
exports.default = router;
