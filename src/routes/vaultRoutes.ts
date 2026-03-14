import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadToVault,
  listVaultFiles,
  getVaultFile,
  downloadVaultFile,
  deleteVaultFile
} from '../controllers/vaultController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir archivo al vault
router.post('/upload', uploadToVault);

// Listar archivos
router.get('/', listVaultFiles);

// Obtener metadatos de un archivo
router.get('/:id', getVaultFile);

// Descargar archivo
router.get('/:id/download', downloadVaultFile);

// Eliminar archivo
router.delete('/:id', deleteVaultFile);

export default router;