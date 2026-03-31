"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const legalAgentController_1 = require("../controllers/legalAgentController");
const router = express_1.default.Router();
// router.use(authenticate); // <-- COMENTADO PARA PRUEBAS
router.post('/consultar', legalAgentController_1.consultarLegal);
router.post('/analizar-contrato', legalAgentController_1.analizarContrato);
router.get('/historial', legalAgentController_1.getHistorial);
exports.default = router;
