import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSessionExpiry(): Date {
  const ttlMs = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ttlMs);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: { id: token, userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function validateAndRefreshSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  // Sliding expiration: every validated request extends the session.
  const newExpiry = getSessionExpiry();
  await prisma.session.update({
    where: { id: token },
    data: { expiresAt: newExpiry },
  });

  return { user: session.user, expiresAt: newExpiry };
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { id: token } }).catch(() => {});
}