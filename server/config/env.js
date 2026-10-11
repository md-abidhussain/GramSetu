import dotenv from 'dotenv';

// Loaded here rather than in server.js because ES module imports run before
// any top-level statement in the importing file, so .env must be read inside
// the first module that needs it.
dotenv.config();

// Fail fast on missing required secrets instead of silently falling back to
// an insecure default (a hardcoded JWT secret was previously shipped here,
// which would let anyone forge valid login tokens if JWT_SECRET was unset).
const required = ['JWT_SECRET', 'MONGODB_URI'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in real values before starting the server.');
  process.exit(1);
}

export const JWT_SECRET = process.env.JWT_SECRET;
