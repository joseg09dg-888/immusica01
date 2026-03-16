import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as VideoController from '../controllers/videoController';

const router = Router();

router.get('/', authenticate, VideoController.getVideos);
router.post('/upload', authenticate, upload.single('video'), VideoController.uploadVideo);
router.delete('/:id', authenticate, VideoController.deleteVideo);
router.put('/:id', authenticate, VideoController.updateVideo);

export default router;
