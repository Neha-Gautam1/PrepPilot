import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { explainWrongAttempt, reviewResumeHandler, listResumeReviews } from './ai.controller';

const router = Router();

router.post('/explain', requireAuth, explainWrongAttempt);
router.post('/review-resume', requireAuth, reviewResumeHandler);
router.get('/review-resume/me', requireAuth, listResumeReviews);

export default router;