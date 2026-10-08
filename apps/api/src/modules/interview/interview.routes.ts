import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { start, answer, listSessions } from './interview.controller';

const router = Router();

router.post('/start', requireAuth, start);
router.post('/answer', requireAuth, answer);
router.get('/me', requireAuth, listSessions);

export default router;