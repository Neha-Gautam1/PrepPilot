import { Request, Response, NextFunction } from 'express';
import { validateAndRefreshSession } from '../modules/auth/auth.service';
import { env } from '../config/env';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const result = await validateAndRefreshSession(token);
  if (!result) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  req.user = result.user;
  next();
}