"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const stripeController_1 = require("../controllers/stripeController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Crear intención de pago
router.post('/create-payment-intent', stripeController_1.createPaymentIntent);
// Obtener suscripciones del usuario
router.get('/subscriptions', stripeController_1.getUserSubscriptions);
exports.default = router;
