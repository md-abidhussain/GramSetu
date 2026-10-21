import dotenv from 'dotenv';

// Tests set their own environment explicitly, so a developer's local .env must
// not leak into them (that is how the suite passed locally but failed in CI).
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

// Values that have appeared in this public repository or its examples. A
// secret anyone can read is not a secret: tokens signed with it can be forged.
export const PUBLISHED_PLACEHOLDER_SECRETS = new Set([
  'super_secure_jwt_token_secret_phrase',
  'your_jwt_secret_token',
  'replace-with-a-long-random-string',
  'fallback_secret',
  'secret',
  'changeme'
]);

export const MIN_JWT_SECRET_LENGTH = 32;

export const isProduction = (env = process.env) => env.NODE_ENV === 'production';

/**
 * Returns a list of problems with the environment. Empty means the server can
 * start. Kept pure (no exit) so it can be unit tested.
 */
export const findConfigProblems = (env = process.env) => {
  const problems = [];

  if (!env.MONGODB_URI) problems.push('MONGODB_URI is not set.');

  const secret = env.JWT_SECRET;
  if (!secret) {
    problems.push('JWT_SECRET is not set.');
  } else if (PUBLISHED_PLACEHOLDER_SECRETS.has(secret.trim().toLowerCase())) {
    problems.push('JWT_SECRET is a published example value. Generate a new one (see docs/DEPLOYMENT.md).');
  } else if (secret.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters.`);
  }

  if (isProduction(env) && !env.CLIENT_ORIGINS) {
    problems.push('CLIENT_ORIGINS must list the front-end URL(s) in production.');
  }

  if (env.TRUST_PROXY !== undefined && env.TRUST_PROXY !== '' && !/^\d+$/.test(env.TRUST_PROXY)) {
    problems.push('TRUST_PROXY must be a number of proxy hops (e.g. 1 or 2).');
  }

  return problems;
};

/** Optional integrations: missing ones disable a feature, they do not stop the server. */
export const describeOptionalConfig = (env = process.env) => ({
  geminiConfigured: Boolean(env.GEMINI_API_KEY),
  cloudinaryConfigured: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
  segmentationConfigured: Boolean(env.SEGMENTATION_SERVICE_URL)
});

// Read at call time so tests can set the variable before use.
export const getJwtSecret = () => process.env.JWT_SECRET;
