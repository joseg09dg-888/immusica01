import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadVideo,
  getMyVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  publishVideo
} from '../controllers/videoController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir video (multipart/form-data)
router.post('/upload', uploadVideo);

// Listar mis videos
router.get('/', getMyVideos);

// Obtener video por ID
router.get('/:id', getVideoById);

// Actualizar video
router.put('/:id', updateVideo);

// Eliminar video
router.delete('/:id', deleteVideo);

// Publicar video (marcar como publicado)
router.post('/:id/publish', publishVideo);

export default router;