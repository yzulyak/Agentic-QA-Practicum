import {
  test,
  expect,
  CATALOG_JSON_CONTENT_TYPE,
  CATALOG_UNAUTH_STATUS,
} from './fixtures';

test('GET /api/v1/availability returns rules and exceptions arrays @api', async ({
  mainApi,
}) => {
  const response = await mainApi.get('/api/v1/availability');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const body: unknown = await response.json();
  expect(body).not.toBeNull();
  expect(typeof body).toBe('object');
  expect(Array.isArray(body)).toBe(false);

  const record = body as Record<string, unknown>;
  expect(Array.isArray(record.rules)).toBe(true);
  expect(Array.isArray(record.exceptions)).toBe(true);
});

test('GET /api/v1/availability without token returns catalog unauth status @api', async ({
  unauthApi,
}) => {
  const response = await unauthApi.get('/api/v1/availability');
  expect(response.status()).toBe(CATALOG_UNAUTH_STATUS);
});
