import express from 'express';
import { authenticate } from '../middleware/auth';
import { chat, getModels, marketIntel, archetypeAnalysis, brandingGeneration, metaAdsCopy, contentPlanGeneration, extractMetadata } from '../controllers/aiController';

const router = express.Router();
router.use(authenticate);
router.post('/chat', chat);
router.get('/models', getModels);
router.post('/market-intel', marketIntel);
router.post('/archetype', archetypeAnalysis);
router.post('/branding', brandingGeneration);
router.post('/meta-ads-copy', metaAdsCopy);
router.post('/content-plan', contentPlanGeneration);
router.post('/extract-metadata', extractMetadata);

export default router;
