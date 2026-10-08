import dotenv from 'dotenv';

dotenv.config();

interface AppEnv {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: string;
  SESSION_COOKIE_NAME: string;
  SESSION_TTL_DAYS: number;
  GROQ_API_KEY: string;
  FRONTEND_URL: string;
  JUDGE0_API_KEY: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: AppEnv = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? 'sid',
  SESSION_TTL_DAYS: Number(process.env.SESSION_TTL_DAYS ?? 7),
  GROQ_API_KEY: requireEnv('GROQ_API_KEY'),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
};