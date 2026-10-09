import { test as base, expect } from '@playwright/test';
import { trackRecord } from '../support/record-tracker';

const CHILDREN_CREATE_PATH = /\/api\/v1\/children\/?$/;

type CreateChildBody = {
  id?: unknown;
};

function isSuccessfulChildrenCreate(url: string, method: string, status: number): boolean {
  if (method !== 'POST' || status < 200 || status >= 300) {
    return false;
  }
  try {
    return CHILDREN_CREATE_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/**
 * Extends the base test: successful POST /api/v1/children responses are tracked for cleanup.
 * Mock ids (prefix "mock-") are skipped. Import `trackRecord` for API-created records.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    page.on('response', async (response) => {
      try {
        const request = response.request();
        if (!isSuccessfulChildrenCreate(response.url(), request.method(), response.status())) {
          return;
        }

        const body = (await response.json()) as CreateChildBody;
        if (typeof body.id !== 'string' || body.id.length === 0) {
          return;
        }
        if (body.id.startsWith('mock-')) {
          return;
        }

        trackRecord({ type: 'child', id: body.id, owner: 'main' });
      } catch {
        // Response may already be consumed or context closed — ignore.
      }
    });

    await use(page);
  },
});

export { expect };
export { trackRecord };
