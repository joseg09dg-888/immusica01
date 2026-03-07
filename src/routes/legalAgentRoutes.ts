import express from 'express';
import { authenticate } from '../middleware/auth';
import { consultarLegal, analizarContrato, getHistorial } from '../controllers/legalAgentController';

const router = express.Router();

// router.use(authenticate); // <-- COMENTADO PARA PRUEBAS

router.post('/consultar', consultarLegal);
router.post('/analizar-contrato', analizarContrato);
router.get('/historial', getHistorial);

export default router;