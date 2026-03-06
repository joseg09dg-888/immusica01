import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSummary, uploadRoyalties, getAllRoyalties } from '../controllers/royaltyController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Resumen de regalías (para el artista autenticado)
router.get('/summary', getSummary);

// Subir archivo CSV de regalías
router.post('/upload', uploadRoyalties);

// Obtener todas las regalías (solo admin)
router.get('/', authorize('admin'), getAllRoyalties);

export default router;