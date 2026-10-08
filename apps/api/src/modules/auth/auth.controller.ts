import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { signupSchema, loginSchema } from './auth.types';
import { hashPassword, verifyPassword, createSession, deleteSession } from './auth.service';
import { env } from '../../config/env';

function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);

  return res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);

  return res.status(200).json({ id: user.id, email: user.email });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (token) {
    await deleteSession(token);
  }
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
  return res.status(200).json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  return res.status(200).json({ id: req.user!.id, email: req.user!.email });
}