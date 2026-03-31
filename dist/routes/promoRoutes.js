"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const promoController_1 = require("../controllers/promoController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Generar tarjeta promocional para un track existente
router.post('/generate', promoController_1.generatePromoCard);
// Generar tarjeta simple con texto personalizado
router.post('/simple', promoController_1.generateSimpleCard);
// Generar reel (video corto) a partir de un track
router.post('/reel', promoController_1.generateReel);
exports.default = router;
