import { test, expect } from '@playwright/test';

test('home page has a title', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
