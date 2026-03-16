import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createFacebookCampaign,
  activateFacebookCampaign,
  getCampaignInsights
} from '../controllers/facebookAdsController';

const router = express.Router();

router.use(authenticate);

router.post('/campaigns', createFacebookCampaign);
router.post('/campaigns/:campaignId/activate', activateFacebookCampaign);
router.get('/campaigns/:campaignId/insights', getCampaignInsights);

export default router;
