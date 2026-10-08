import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { getMyRecommendations } from './recommendations.controller';

const router = Router();

router.get('/me', requireAuth, getMyRecommendations);

export default router;