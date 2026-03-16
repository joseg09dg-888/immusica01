import { Router } from 'express';
import * as bulkUploadController from '../controllers/bulkUploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/files', authenticate, upload.array('files', 10), bulkUploadController.bulkUpload);

export default router;
