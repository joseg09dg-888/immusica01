import { Router } from 'express';
import * as moodController from '../controllers/moodController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Spotify Auth routes
router.get('/login', moodController.spotifyLogin);
router.get('/callback', moodController.spotifyCallback);

// Recommendation route
router.get('/recommendations', moodController.getRecommendations);

export default router;
