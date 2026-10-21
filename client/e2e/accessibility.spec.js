import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DEMO, signInOfficial } from './helpers.js';

// Automated checks catch roughly a third of accessibility problems; this is a
// floor, not a certificate. Serious and critical WCAG A/AA findings fail the test.
const scan = async (page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('.leaflet-container') // third-party map tiles
    .analyze();
  return results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
};

const describe = (violations) => violations.map((v) => `${v.id}: ${v.nodes.length} element(s) - ${v.help}`).join('\n');

test('login page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/login');
  const violations = await scan(page);
  expect(violations, describe(violations)).toEqual([]);
});

test('citizen report page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address or mobile number').fill(DEMO.citizen.identifier);
  await page.getByLabel('Password').fill(DEMO.citizen.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/verify/);
  const violations = await scan(page);
  expect(violations, describe(violations)).toEqual([]);
});

test('official dashboard has no serious accessibility violations', async ({ page }) => {
  await signInOfficial(page, DEMO.authority);
  await expect(page.getByText(/Total Projects/i).first()).toBeVisible();
  const violations = await scan(page);
  expect(violations, describe(violations)).toEqual([]);
});
