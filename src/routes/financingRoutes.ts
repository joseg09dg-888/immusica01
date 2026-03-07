import express from 'express';
import { authenticate } from '../middleware/auth';
import { evaluarElegibilidad, obtenerMiElegibilidad, solicitarConsultoria } from '../controllers/financingController';

const router = express.Router();

router.use(authenticate);

router.post('/evaluar', evaluarElegibilidad);
router.get('/mi-elegibilidad', obtenerMiElegibilidad);
router.post('/solicitar', solicitarConsultoria);

export default router;