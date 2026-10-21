import { expect, test } from '@playwright/test';

test('login and report pages fit a phone screen without sideways scrolling', async ({ page }) => {
  await page.goto('/login');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByLabel('Email address or mobile number').fill('citizen@gmail.com');
  await page.getByLabel('Password').fill('citizen123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/verify/);
  const reportOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(reportOverflow).toBeLessThanOrEqual(1);
});
