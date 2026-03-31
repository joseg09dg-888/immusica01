"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const feedbackController_1 = require("../controllers/feedbackController");
const router = express_1.default.Router();
// Rutas que requieren autenticación
router.use(auth_1.authenticate);
// Enviar feedback (cualquier usuario autenticado)
router.post('/', feedbackController_1.createFeedback);
// Obtener mis feedbacks
router.get('/my', feedbackController_1.getMyFeedback);
// Obtener un feedback por ID (propio o admin)
router.get('/:id', feedbackController_1.getFeedbackById);
// Rutas solo para admin
router.put('/:id/status', feedbackController_1.updateFeedbackStatus);
router.get('/admin/all', feedbackController_1.getAllFeedback);
exports.default = router;
