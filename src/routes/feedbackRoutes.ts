import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import {
  createFeedback,
  getMyFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getAllFeedback
} from '../controllers/feedbackController';

const router = express.Router();

// Rutas que requieren autenticación
router.use(authenticate);

// Enviar feedback (cualquier usuario autenticado)
router.post('/', validate(schemas.createFeedback), createFeedback);

// Obtener mis feedbacks — alias raíz y /my
router.get('/', getMyFeedback);
router.get('/my', getMyFeedback);

// Obtener un feedback por ID (propio o admin)
router.get('/:id', getFeedbackById);

// Rutas solo para admin
router.put('/:id/status', updateFeedbackStatus);
router.get('/admin/all', getAllFeedback);

export default router;