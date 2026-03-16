import express from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { getVaultFiles, uploadToVault, deleteFromVault } from '../controllers/vaultController';

const router = express.Router();

router.use(authenticate);

router.get('/', getVaultFiles);
router.post('/', upload.single('file'), uploadToVault);
router.delete('/:id', deleteFromVault);

export default router;
