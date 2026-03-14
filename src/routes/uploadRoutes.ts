import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadFile,
  uploadCover,
  uploadAudio,
  uploadPDF,
  uploadCatalog
} from '../controllers/uploadController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subida de archivo genérico
router.post('/file', uploadFile);

// Subida de carátula con redimensionado
router.post('/cover', uploadCover);

// Subida de archivo de audio con metadatos
router.post('/audio', uploadAudio);

// Subida de PDF
router.post('/pdf', uploadPDF);

// Subida de catálogo ZIP
router.post('/catalog', uploadCatalog);

export default router;