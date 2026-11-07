import { DashboardPage } from '../../pages';
import { test, expect, trackRecord } from '../../fixtures/cleanup.fixture';
import { createApiContextForOwner } from '../../support/api-client';
import { buildChild } from '../../test-data/factories/child.factory';

type CreatedChild = {
  id: string;
  firstName: string;
  age: number;
  gender: string | null;
};

type MeFamilyChild = {
  id: string;
};

type MeResponse = {
  family: {
    name: string;
    children: MeFamilyChild[];
  };
};

/** Maps API gender values the way AQPBT-5's manage-kids remove test does. */
function genderLabel(gender: string): string {
  if (gender === 'boy') return 'Boy';
  if (gender === 'girl') return 'Girl';
  return gender;
}

/**
 * Builds the dashboard child row summary line (same shape as AQPBT-5).
 * When gender is null (factory default), the live UI omits the ` · {Boy|Girl}` suffix.
 */
function childSummaryLine(child: Pick<CreatedChild, 'firstName' | 'age' | 'gender'>): string {
  if (child.gender == null || child.gender === '') {
    return `${child.firstName}, ${child.age}`;
  }
  return `${child.firstName}, ${child.age} · ${genderLabel(child.gender)}`;
}

test(
  'API-arranged child appears on Dashboard, UI remove, API proves gone',
  { tag: '@destructive' },
  async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const api = await createApiContextForOwner('main');

    let familyName = '';
    let childId = '';
    let summaryLine = '';
    let kidsAfterCreate = 0;

    try {
      await test.step('API: arrange', async () => {
        const meBeforeResponse = await api.get('/api/v1/me');
        expect(meBeforeResponse.status()).toBe(200);
        const meBefore = (await meBeforeResponse.json()) as MeResponse;
        familyName = meBefore.family.name;
        const kidsBefore = meBefore.family.children.length;

        const payload = buildChild();
        const createResponse = await api.post('/api/v1/children', { data: payload });
        expect(createResponse.status()).toBe(201);

        const created = (await createResponse.json()) as CreatedChild;
        trackRecord({ type: 'child', id: created.id, owner: 'main' });

        childId = created.id;
        summaryLine = childSummaryLine(created);
        kidsAfterCreate = kidsBefore + 1;
      });

      await test.step('UI: check', async () => {
        await dashboard.goto();
        await expect(dashboard.childSummaryLocator(familyName, summaryLine)).toBeVisible();
        await expect.poll(() => dashboard.getMyKidsCount()).toBe(kidsAfterCreate);
      });

      await test.step('UI: act', async () => {
        await dashboard.removeChild(familyName, summaryLine);
      });

      await test.step('API: prove', async () => {
        await expect
          .poll(async () => {
            const meResponse = await api.get('/api/v1/me');
            expect(meResponse.status()).toBe(200);
            const me = (await meResponse.json()) as MeResponse;
            return me.family.children.some((child) => child.id === childId);
          })
          .toBe(false);
      });
    } finally {
      await api.dispose();
    }
  },
);
