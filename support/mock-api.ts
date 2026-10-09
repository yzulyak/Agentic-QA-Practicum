import type { Page } from '@playwright/test';

const ME_URL = '**/api/v1/me';

type MePayload = {
  children?: unknown[];
  [key: string]: unknown;
};

/**
 * Forces GET /api/v1/me to report an empty children list (passthrough for other methods).
 * Live payload is reused; only `children` is cleared.
 */
export async function mockEmptyChildrenList(page: Page): Promise<void> {
  await page.route(ME_URL, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const response = await route.fetch();
    const payload = (await response.json()) as MePayload;
    payload.children = [];

    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });
}

/**
 * Forces GET /api/v1/me to return a deterministic server error.
 * Mock ids start with "mock-".
 */
export async function mockChildrenListServerError(page: Page): Promise<void> {
  await page.route(ME_URL, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'mock-error',
        error: 'mock-server-error',
        message: 'Simulated children list failure',
      }),
    });
  });
}
