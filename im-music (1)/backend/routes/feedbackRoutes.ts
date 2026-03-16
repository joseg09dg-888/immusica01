import express from 'express';
import { authenticate } from '../middleware/auth';
import * as feedbackController from '../controllers/feedbackController';

const router = express.Router();

router.use(authenticate);

router.post('/', feedbackController.submitFeedback);
router.get('/my', feedbackController.getMyFeedback);
router.get('/all', feedbackController.getAllFeedback);
router.put('/:id', feedbackController.updateFeedback);

export default router;
