import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSummary, uploadRoyalties, getAllRoyalties, processRoyalty, getWithholdingsByTrack, getMyWithholdings, releaseWithholding } from '../controllers/royaltyController';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.post('/upload', uploadRoyalties);
router.get('/', getAllRoyalties);

router.post('/process', processRoyalty);
router.get('/withholdings/track/:trackId', getWithholdingsByTrack);
router.get('/withholdings/my', getMyWithholdings);
router.put('/withholdings/:withholdingId/release', releaseWithholding);

export default router;
