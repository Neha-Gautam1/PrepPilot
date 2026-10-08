import { Router } from 'express';
import { signup, login, logout, me } from './auth.controller';
import { requireAuth } from '../../middlewares/requireAuth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;