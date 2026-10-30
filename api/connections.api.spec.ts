import {
  test,
  expect,
  CATALOG_JSON_CONTENT_TYPE,
  CATALOG_UNAUTH_STATUS,
} from './fixtures';

test('GET /api/v1/connections returns a JSON array @api', async ({ mainApi }) => {
  const response = await mainApi.get('/api/v1/connections');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const body: unknown = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /api/v1/connections without token returns catalog unauth status @api', async ({
  unauthApi,
}) => {
  const response = await unauthApi.get('/api/v1/connections');
  expect(response.status()).toBe(CATALOG_UNAUTH_STATUS);
});
