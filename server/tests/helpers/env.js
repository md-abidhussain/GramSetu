// Imported first by every HTTP test file, before the app, so modules read
// test settings. Values here are test-only and never used anywhere real.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-0123456789abcdef0123456789abcdef';
process.env.CLIENT_ORIGINS = 'http://localhost:3000';
process.env.AUTH_RATE_LIMIT_MAX ??= '10000';
process.env.UPLOAD_RATE_LIMIT_MAX ??= '10000';
process.env.GLOBAL_RATE_LIMIT_MAX ??= '100000';
process.env.AI_RETRY_BASE_MS = '1';
// Real AI and real detection are never called from tests.
delete process.env.GEMINI_API_KEY;
delete process.env.SEGMENTATION_SERVICE_URL;
delete process.env.CLOUDINARY_CLOUD_NAME;
