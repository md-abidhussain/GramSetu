import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real built client, the real API and a real
// MongoDB. They need E2E_MONGODB_URI (a disposable database: it is wiped and
// reseeded). Optionally E2E_SEGMENTATION_URL points at a running detection
// service; without it, detection is recorded as not configured.
const API_PORT = Number(process.env.E2E_API_PORT || 5055);
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 4173);

if (!process.env.E2E_MONGODB_URI) {
  throw new Error('Set E2E_MONGODB_URI to a disposable MongoDB database before running end-to-end tests.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } } : {})
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.js/ }
  ],
  webServer: [
    {
      command: 'node server.js',
      cwd: '../server',
      url: `http://localhost:${API_PORT}/health/ready`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        MONGODB_URI: process.env.E2E_MONGODB_URI,
        JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
        CLIENT_ORIGINS: `http://localhost:${WEB_PORT}`,
        SEED_DB: 'force',
        ADMIN_PASSWORD: 'e2e-admin-password-long',
        STORAGE_DRIVER: 'local',
        LOCAL_UPLOAD_DIR: '../client/test-results/uploads',
        PUBLIC_BASE_URL: `http://localhost:${API_PORT}`,
        SEGMENTATION_SERVICE_URL: process.env.E2E_SEGMENTATION_URL || '',
        GEMINI_API_KEY: ''
      }
    },
    {
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_PROXY_TARGET: `http://localhost:${API_PORT}` }
    }
  ]
});
