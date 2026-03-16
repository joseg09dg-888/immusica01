import express from 'express';
import { authenticate } from '../middleware/auth';
import * as statsController from '../controllers/statsController';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), statsController.uploadStats);
router.get('/track/:trackId', statsController.getTrackStats);
router.get('/summary', statsController.getSummary);
router.get('/tracks', statsController.getArtistTracks);

export default router;
