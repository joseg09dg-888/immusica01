"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const financingController_1 = require("../controllers/financingController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/evaluar', financingController_1.evaluarElegibilidad);
router.get('/mi-elegibilidad', financingController_1.obtenerMiElegibilidad);
router.post('/solicitar', financingController_1.solicitarConsultoria);
exports.default = router;
