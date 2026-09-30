import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_FILE, ALT_AUTH_FILE } from '../support/auth.constants';
import { LoginPage } from '../pages';
import { AppRoute } from '../test-data/routes';

setup('authenticate main family', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.logIn(process.env.APP_USER_EMAIL!, process.env.APP_USER_PASSWORD!);
  await page.waitForURL(`**${AppRoute.Dashboard}`);
  await expect(page).not.toHaveURL(new RegExp(`${AppRoute.Login}$`));
  await fs.promises.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});

setup('authenticate second family', async ({ page }) => {
  setup.skip(
    !process.env.APP_ALT_USER_EMAIL || !process.env.APP_ALT_USER_PASSWORD,
    'APP_ALT_USER_EMAIL / APP_ALT_USER_PASSWORD unset — skipping second-family auth',
  );

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.logIn(process.env.APP_ALT_USER_EMAIL!, process.env.APP_ALT_USER_PASSWORD!);
  await page.waitForURL(`**${AppRoute.Dashboard}`);
  await expect(page).not.toHaveURL(new RegExp(`${AppRoute.Login}$`));
  await fs.promises.mkdir(path.dirname(ALT_AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: ALT_AUTH_FILE });
});
