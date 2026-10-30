import {
  test,
  expect,
  CATALOG_JSON_CONTENT_TYPE,
  CATALOG_UNAUTH_STATUS,
} from './fixtures';

test('GET /api/v1/me returns catalog shape @api', async ({ mainApi }) => {
  const response = await mainApi.get('/api/v1/me');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const body: unknown = await response.json();
  expect(body).not.toBeNull();
  expect(typeof body).toBe('object');
  expect(Array.isArray(body)).toBe(false);

  const record = body as Record<string, unknown>;
  expect(typeof record.parent).toBe('object');
  expect(record.parent).not.toBeNull();
  expect(Array.isArray(record.parent)).toBe(false);
  expect(typeof record.family).toBe('object');
  expect(record.family).not.toBeNull();
  expect(Array.isArray(record.family)).toBe(false);
  expect(typeof record.isAdmin).toBe('boolean');
});

test('GET /api/v1/me without token returns catalog unauth status @api', async ({
  unauthApi,
}) => {
  const response = await unauthApi.get('/api/v1/me');
  expect(response.status()).toBe(CATALOG_UNAUTH_STATUS);
});
