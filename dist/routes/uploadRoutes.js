"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Subida de archivo genérico
router.post('/file', uploadController_1.uploadFile);
// Subida de carátula con redimensionado
router.post('/cover', uploadController_1.uploadCover);
// Subida de archivo de audio con metadatos
router.post('/audio', uploadController_1.uploadAudio);
// Subida de PDF
router.post('/pdf', uploadController_1.uploadPDF);
// Subida de catálogo ZIP
router.post('/catalog', uploadController_1.uploadCatalog);
exports.default = router;
