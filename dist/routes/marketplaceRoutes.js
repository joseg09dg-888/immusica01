"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const marketplaceController_1 = require("../controllers/marketplaceController");
const router = express_1.default.Router();
// Rutas públicas
router.get('/beats', marketplaceController_1.listarBeats);
router.get('/beats/:id', marketplaceController_1.verBeat);
router.get('/rankings', marketplaceController_1.rankings);
// Rutas protegidas (requieren autenticación)
router.post('/beats', auth_1.authenticate, marketplaceController_1.subirBeat);
router.post('/beats/:id/comprar', auth_1.authenticate, marketplaceController_1.comprarBeat);
router.post('/beats/:id/valorar', auth_1.authenticate, marketplaceController_1.valorarBeat);
router.get('/mis-beats', auth_1.authenticate, marketplaceController_1.misBeats);
router.get('/mis-compras', auth_1.authenticate, marketplaceController_1.misCompras);
router.get('/mis-estadisticas', auth_1.authenticate, marketplaceController_1.estadisticasUsuario);
exports.default = router;
