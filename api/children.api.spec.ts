import {
  test,
  expect,
  trackRecord,
  CATALOG_JSON_CONTENT_TYPE,
} from './fixtures';
import { buildChild } from '../test-data/factories/child.factory';
import { deleteChild } from '../support/api-client';

type CreatedChild = {
  id: string;
  firstName: string;
  birthYear: number;
  birthMonth: number;
  age: number;
  gender: unknown;
  interests: unknown;
  avatarKey: string;
};

test('POST child, find via GET /me, then DELETE @api', async ({ mainApi }) => {
  const payload = buildChild();

  const createResponse = await mainApi.post('/api/v1/children', { data: payload });
  expect(createResponse.status()).toBe(201);
  expect(createResponse.headers()['content-type']).toBe(CATALOG_JSON_CONTENT_TYPE);

  const createdBody: unknown = await createResponse.json();
  expect(createdBody).not.toBeNull();
  expect(typeof createdBody).toBe('object');
  expect(Array.isArray(createdBody)).toBe(false);

  const created = createdBody as CreatedChild;
  expect(typeof created.id).toBe('string');
  expect(created.id.length).toBeGreaterThan(0);
  expect(typeof created.firstName).toBe('string');
  expect(created.firstName).toBe(payload.firstName);
  expect(typeof created.birthYear).toBe('number');
  expect(typeof created.birthMonth).toBe('number');
  expect(typeof created.age).toBe('number');
  expect('gender' in created).toBe(true);
  expect(Array.isArray(created.interests)).toBe(true);
  expect(typeof created.avatarKey).toBe('string');

  trackRecord({ type: 'child', id: created.id, owner: 'main' });

  const meResponse = await mainApi.get('/api/v1/me');
  expect(meResponse.status()).toBe(200);

  const meBody: unknown = await meResponse.json();
  expect(meBody).not.toBeNull();
  expect(typeof meBody).toBe('object');
  const me = meBody as { family: { children: unknown } };
  expect(typeof me.family).toBe('object');
  expect(Array.isArray(me.family.children)).toBe(true);

  const children = me.family.children as Array<Record<string, unknown>>;
  const found = children.find((child) => child.id === created.id);
  expect(found).toBeTruthy();

  const deleted = await deleteChild('main', created.id);
  expect(deleted.ok).toBe(true);
  expect(deleted.status).toBe(204);
});
