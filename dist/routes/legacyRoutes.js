"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const legacyController_1 = require("../controllers/legacyController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Comprar Leave a Legacy para un track específico
router.post('/purchase', legacyController_1.purchaseLegacy);
// Comprar Leave a Legacy para todo el catálogo
router.post('/purchase-all', legacyController_1.purchaseLegacyForAll);
// Ver estado de un track
router.get('/status/:trackId', legacyController_1.getLegacyStatus);
// Listar compras realizadas
router.get('/my', legacyController_1.listLegacyPurchases);
exports.default = router;
