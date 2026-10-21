import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
export const PHOTO = path.join(here, '../../test-assets/road-after.jpg');
export const EVIDENCE = path.join(here, '../../test-assets/road-before.jpg');

export const DEMO = {
  citizen: { identifier: 'citizen@gmail.com', password: 'citizen123' },
  authority: { identifier: 'authority@gramsetu.gov', password: 'authority123' },
  inspector: { identifier: 'inspector@gramsetu.gov', password: 'inspector123' }
};

export const signInOfficial = async (page, { identifier, password }) => {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Government official' }).click();
  await page.getByLabel('Official email or user ID').fill(identifier);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
};

export const signOut = async (page) => {
  await page.getByRole('button', { name: /sign out|log out/i }).first().click();
  await expect(page).toHaveURL(/\/login/);
};
