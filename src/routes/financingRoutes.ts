import express from 'express';
import { authenticate } from '../middleware/auth';
import { evaluarElegibilidad, obtenerMiElegibilidad, solicitarConsultoria } from '../controllers/financingController';

const router = express.Router();

router.use(authenticate);

router.post('/evaluar', evaluarElegibilidad);
router.get('/eligibility', obtenerMiElegibilidad);
router.get('/mi-elegibilidad', obtenerMiElegibilidad);
router.get('/solicitud', (req, res) => res.json([]));
router.post('/solicitar', solicitarConsultoria);

export default router;