import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { getSummary } from './dashboard.controller';

const router = Router();

router.get('/summary', requireAuth, getSummary);

export default router;