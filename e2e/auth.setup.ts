import { expect, test as setup } from '@playwright/test';

const STORAGE_STATE = 'playwright/.auth/user.json';

setup('sign in and save the login state', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD in .env.local.');
  }

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/notes/);

  await page.context().storageState({ path: STORAGE_STATE });
});
