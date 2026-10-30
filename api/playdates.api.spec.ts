import {
  test,
  expect,
  CATALOG_JSON_CONTENT_TYPE,
  CATALOG_UNAUTH_STATUS,
} from './fixtures';

test('GET /api/v1/playdates returns a JSON array @api', async ({ mainApi }) => {
  const response = await mainApi.get('/api/v1/playdates');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const body: unknown = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /api/v1/playdates?filter=upcoming returns a JSON array @api', async ({
  mainApi,
}) => {
  const response = await mainApi.get('/api/v1/playdates?filter=upcoming');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const body: unknown = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /api/v1/playdates without token returns catalog unauth status @api', async ({
  unauthApi,
}) => {
  const response = await unauthApi.get('/api/v1/playdates');
  expect(response.status()).toBe(CATALOG_UNAUTH_STATUS);
});

test('GET /api/v1/playdates?filter=upcoming without token returns catalog unauth status @api', async ({
  unauthApi,
}) => {
  const response = await unauthApi.get('/api/v1/playdates?filter=upcoming');
  expect(response.status()).toBe(CATALOG_UNAUTH_STATUS);
});
