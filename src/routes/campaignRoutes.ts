import express from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = express.Router();
router.use(authenticate);

// Placeholder campaign routes
router.get('/', (req: AuthRequest, res: Response) => {
  res.json({ campaigns: [], message: 'Campaigns module coming soon' });
});

router.post('/', (req: AuthRequest, res: Response) => {
  res.status(201).json({ message: 'Campaign created' });
});

export default router;
