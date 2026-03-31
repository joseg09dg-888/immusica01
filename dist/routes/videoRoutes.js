"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const videoController_1 = require("../controllers/videoController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Subir video (multipart/form-data)
router.post('/upload', videoController_1.uploadVideo);
// Listar mis videos
router.get('/', videoController_1.getMyVideos);
// Obtener video por ID
router.get('/:id', videoController_1.getVideoById);
// Actualizar video
router.put('/:id', videoController_1.updateVideo);
// Eliminar video
router.delete('/:id', videoController_1.deleteVideo);
// Publicar video (marcar como publicado)
router.post('/:id/publish', videoController_1.publishVideo);
exports.default = router;
