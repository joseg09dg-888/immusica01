import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadFiles, getJobStatus, confirmExtraction } from '../controllers/uploadController';

const router = express.Router();

router.use(authenticate);

router.post('/files', uploadFiles);
router.get('/job/:jobId', getJobStatus);
router.post('/job/:jobId/confirm', confirmExtraction);

export default router;