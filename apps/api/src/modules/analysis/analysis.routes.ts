import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { recompute, getMyProfiles } from './analysis.controller';

const router = Router();

router.post('/recompute', requireAuth, recompute);
router.get('/me', requireAuth, getMyProfiles);

export default router;