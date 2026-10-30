import { request, type APIRequestContext } from '@playwright/test';
import { test as cleanupTest, expect, trackRecord } from '../fixtures/cleanup.fixture';
import { createApiContextForOwner } from '../support/api-client';
import type { RecordOwner } from '../support/record-tracker';

type ApiFixtures = {
  /** Authenticated request context for the main family. */
  mainApi: APIRequestContext;
  /** Authenticated request context for the second family. */
  altApi: APIRequestContext;
  /** Request context with no Authorization header. */
  unauthApi: APIRequestContext;
};

async function disposeAfterUse(
  owner: RecordOwner,
  use: (ctx: APIRequestContext) => Promise<void>,
): Promise<void> {
  const ctx = await createApiContextForOwner(owner);
  try {
    await use(ctx);
  } finally {
    await ctx.dispose();
  }
}

export const test = cleanupTest.extend<ApiFixtures>({
  mainApi: async ({}, use) => {
    await disposeAfterUse('main', use);
  },

  altApi: async ({}, use) => {
    await disposeAfterUse('alt', use);
  },

  unauthApi: async ({}, use) => {
    const baseURL = process.env.APP_URL;
    if (!baseURL) {
      throw new Error('APP_URL is not set');
    }
    const ctx = await request.newContext({ baseURL });
    try {
      await use(ctx);
    } finally {
      await ctx.dispose();
    }
  },
});

export { expect, trackRecord };

/** Content-Type recorded in api/CATALOG.md for JSON API responses. */
export const CATALOG_JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

/** Unauthenticated GET status recorded in api/CATALOG.md. */
export const CATALOG_UNAUTH_STATUS = 401;
