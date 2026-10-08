import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { codeExecutionLimiter } from '../../middlewares/rateLimiters';
import { submitMcq, submitSql, submitDsa, getMyHistory } from './activities.controller';

const router = Router();

router.post('/mcq', requireAuth, submitMcq);
router.post('/sql', requireAuth, submitSql);
router.post('/dsa', requireAuth, codeExecutionLimiter, submitDsa);
router.get('/me', requireAuth, getMyHistory);

export default router;