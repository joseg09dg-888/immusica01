import { Router } from 'express';
import * as legalController from '../controllers/legalController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/consultar', authenticate, legalController.consultarLegal);

export default router;
