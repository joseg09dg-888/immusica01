"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const marketingController_1 = require("../controllers/marketingController");
console.log('🔥 marketingRoutes.ts se ha cargado correctamente');
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Rutas de branding (existentes)
router.get('/preguntas', marketingController_1.getPreguntas);
router.post('/test', marketingController_1.procesarTest);
router.post('/generar-branding', marketingController_1.generarBrandingSensorial);
router.post('/generar-mercado', marketingController_1.generarMercadoObjetivo);
router.post('/generar-plan', marketingController_1.generarPlanContenidos);
router.get('/mi-branding', marketingController_1.getMiBranding);
// Nuevas rutas de promoción con IA
router.post('/generate-description', marketingController_1.generateDescription);
router.post('/generate-hashtags', marketingController_1.generateHashtags);
router.post('/generate-social-post', marketingController_1.generateSocialPost);
exports.default = router;
