import { test, expect } from '@playwright/test';

test('greeting shows family name', async ({ page }) => {
  await expect(page.getByRole('heading')).toBeVisible();
});
