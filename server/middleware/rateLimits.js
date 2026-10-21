import rateLimit from 'express-rate-limit';

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// Created per app instance so every test (and every server process) starts with
// a fresh in-memory counter. Counters are per process: with several instances
// behind a load balancer each one counts separately (see docs/DEPLOYMENT.md).

/** Login and registration: slows password guessing. Session checks (/me) are NOT counted. */
export const createCredentialLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: numberFromEnv('AUTH_RATE_LIMIT_MAX', 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' }
});

/** Writes that store a file or call a paid AI service. Reads are not counted. */
export const createExpensiveWriteLimiter = () => rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: numberFromEnv('UPLOAD_RATE_LIMIT_MAX', 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
  message: { message: 'You have sent a lot of uploads in a short time. Please try again later.' }
});

/** A broad ceiling on everything, so one client cannot flood the API. */
export const createGlobalLimiter = () => rateLimit({
  windowMs: 60 * 1000,
  limit: numberFromEnv('GLOBAL_RATE_LIMIT_MAX', 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
});
