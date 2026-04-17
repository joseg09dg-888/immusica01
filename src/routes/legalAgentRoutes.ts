import express from 'express';
import { authenticate } from '../middleware/auth';
import { consultarLegal, analizarContrato, getHistorial } from '../controllers/legalAgentController';

const router = express.Router();

router.use(authenticate);

router.post('/consultar', consultarLegal);
router.post('/consulta', consultarLegal);  // alias used by frontend
router.post('/analizar-contrato', analizarContrato);
router.get('/historial', getHistorial);

export default router;