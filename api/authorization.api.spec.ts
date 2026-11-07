import type { APIRequestContext } from '@playwright/test';
import { test, expect, trackRecord } from './fixtures';
import { buildChild } from '../test-data/factories/child.factory';

type CreatedChild = {
  id: string;
};

type MeBody = {
  parent?: { id?: string };
  family: {
    id?: string;
    children: Array<{ id: string }>;
  } | null;
};

/** Statuses observed on the probe run of this file (2026-11-06). */
const ALT_DELETE_FOREIGN_CHILD_STATUS = 400;
const ANON_DELETE_CHILD_STATUS = 401;

async function createTrackedChild(mainApi: APIRequestContext): Promise<string> {
  const payload = buildChild();
  const createResponse = await mainApi.post('/api/v1/children', { data: payload });
  expect(createResponse.status()).toBe(201);

  const createdBody: unknown = await createResponse.json();
  const created = createdBody as CreatedChild;
  expect(typeof created.id).toBe('string');
  expect(created.id.length).toBeGreaterThan(0);

  trackRecord({ type: 'child', id: created.id, owner: 'main' });
  return created.id;
}

async function familyChildIds(api: APIRequestContext): Promise<string[]> {
  const meResponse = await api.get('/api/v1/me');
  expect(meResponse.status()).toBe(200);

  const meBody: unknown = await meResponse.json();
  expect(meBody).not.toBeNull();
  expect(typeof meBody).toBe('object');

  const me = meBody as MeBody;
  if (me.family === null) {
    return [];
  }

  expect(Array.isArray(me.family.children)).toBe(true);
  return me.family.children.map((child) => child.id);
}

test('Family B cannot delete family A child', { tag: '@api' }, async ({ mainApi, altApi }) => {
  const childId = await createTrackedChild(mainApi);

  const deleteResponse = await altApi.delete(`/api/v1/children/${childId}`);
  expect(deleteResponse.status()).toBe(ALT_DELETE_FOREIGN_CHILD_STATUS);

  const mainIds = await familyChildIds(mainApi);
  expect(mainIds).toContain(childId);

  const altIds = await familyChildIds(altApi);
  expect(altIds).not.toContain(childId);
});

test('No token cannot delete family A child', { tag: '@api' }, async ({ mainApi, unauthApi }) => {
  const childId = await createTrackedChild(mainApi);

  const deleteResponse = await unauthApi.delete(`/api/v1/children/${childId}`);
  expect(deleteResponse.status()).toBe(ANON_DELETE_CHILD_STATUS);

  const mainIds = await familyChildIds(mainApi);
  expect(mainIds).toContain(childId);
});

test('Family B /me does not include family A markers', { tag: '@api' }, async ({
  mainApi,
  altApi,
}) => {
  const childId = await createTrackedChild(mainApi);

  const baselineResponse = await mainApi.get('/api/v1/me');
  expect(baselineResponse.status()).toBe(200);
  const baselineRaw = await baselineResponse.text();
  const baselineMe = JSON.parse(baselineRaw) as MeBody;
  expect(baselineMe.family).not.toBeNull();
  expect(baselineMe.family!.children.some((child) => child.id === childId)).toBe(true);

  const markers = [childId];
  if (baselineMe.family?.id) {
    markers.push(baselineMe.family.id);
  }
  if (baselineMe.parent?.id) {
    markers.push(baselineMe.parent.id);
  }

  const altMe = await altApi.get('/api/v1/me');
  expect(altMe.status()).toBe(200);
  const altMeRaw = await altMe.text();
  for (const marker of markers) {
    expect(altMeRaw.includes(marker)).toBe(false);
  }
});
