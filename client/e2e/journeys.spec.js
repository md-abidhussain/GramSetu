import { expect, test } from '@playwright/test';
import { DEMO, EVIDENCE, PHOTO, signInOfficial } from './helpers.js';

const PLACE = `E2E Test Lane ${Date.now()}`;

test.describe.configure({ mode: 'serial' });

test('a new citizen signs up and files a complaint with a photo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Full name').fill('E2E Citizen');
  await page.getByLabel('Email address').fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('a-long-e2e-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/verify/);

  // No calibration field is asked of citizens any more.
  await expect(page.getByText(/cm per pixel/i)).toHaveCount(0);

  await page.getByLabel(/project/i).first().selectOption('custom');
  await page.getByLabel(/name|title/i).filter({ hasNot: page.locator('select') }).first().fill(PLACE);
  await page.getByLabel(/describe|description/i).fill('Deep pothole in the middle of the lane.');
  await page.getByText('Enter coordinates instead').click();
  await page.getByLabel('Latitude').fill('25.3176');
  await page.getByLabel('Longitude').fill('82.9739');
  await page.getByLabel('Photo of the problem').setInputFiles(PHOTO);
  await page.getByRole('button', { name: /Submit/ }).click();

  await expect(page.getByText('Report filed.', { exact: false })).toBeVisible({ timeout: 45_000 });
  // Gemini is deliberately not configured here, so the page must say so instead of showing a score.
  await expect(page.getByText(/AI not set up/)).toBeVisible();
  await expect(page.getByText(/\/ 100/)).toHaveCount(0);

  await page.goto('/verify?tab=track');
  await expect(page.getByText(PLACE).first()).toBeVisible();
});

test('an official assigns the inspector, the inspector uploads evidence, the official accepts', async ({ page }) => {
  await signInOfficial(page, DEMO.authority);
  const row = page.getByRole('button', { name: new RegExp(PLACE) }).first();
  await row.click();
  await page.getByRole('button', { name: 'Assign inspector' }).click();
  await expect(page.getByText(/Inspector Assigned/).first()).toBeVisible();

  await page.getByRole('button', { name: /log out/i }).click();
  await signInOfficial(page, DEMO.inspector);
  await page.getByRole('button', { name: new RegExp(PLACE) }).first().click();
  await page.getByLabel('Site photo').setInputFiles(EVIDENCE);
  await page.getByLabel('Inspection notes').fill('Filled and compacted the pothole.');
  await page.getByRole('button', { name: /Submit Verification Proof/i }).click();
  await expect(page.getByText(/Inspector Uploads Verification/).first()).toBeVisible({ timeout: 30_000 });

  // An inspector cannot take the final decision.
  await expect(page.getByRole('button', { name: /Accept & Publish/i })).toHaveCount(0);

  await page.getByRole('button', { name: /log out/i }).click();
  await signInOfficial(page, DEMO.authority);
  await page.getByRole('button', { name: new RegExp(PLACE) }).first().click();
  await page.getByLabel(/Decision summary/).fill('Repair confirmed on site.');
  await page.getByRole('button', { name: /Accept & Publish/i }).click();
  await expect(page.getByText(/Resolution published/i).first()).toBeVisible();
});

test('signing out ends the session and protected pages send you to sign in', async ({ page }) => {
  await signInOfficial(page, DEMO.authority);
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  const me = await page.request.get('/api/auth/me');
  expect(me.status()).toBe(401);
});

test('the public API does not expose tender documents', async ({ request }) => {
  const response = await request.get('/api/projects');
  expect(response.ok()).toBeTruthy();
  const projects = await response.json();
  expect(projects.length).toBeGreaterThan(0);
  for (const project of projects) {
    expect(project.tender?.fileUrl).toBeUndefined();
    expect(project.tender?.extractedText).toBeUndefined();
    expect(project.contractor?.phone).toBeUndefined();
  }
  const tenders = await request.get('/api/tenders');
  expect(tenders.status()).toBe(401);
});

test('the old public Admin password no longer works', async ({ request }) => {
  const response = await request.post('/api/auth/authority/login', {
    data: { identifier: 'admin@gramsetu.gov', password: 'authority123' },
    headers: { Origin: 'http://localhost:4173' }
  });
  expect(response.status()).toBe(401);
});
