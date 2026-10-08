import rateLimit from 'express-rate-limit';

// Auth: prevent brute-force login/signup attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints: these cost real money per call (Groq) and can run slowly —
// cap more tightly than general API usage.
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// DSA code execution: runs arbitrary submitted code via vm — cap aggressively
// since each request has real CPU cost and (per SECURITY.md) is not a hard
// security boundary.
export const codeExecutionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: { error: 'Too many code execution requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API baseline — generous, just a backstop against runaway clients/bugs.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});