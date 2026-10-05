import { test as base, expect } from '@playwright/test';
import {
  ProfilePage,
  type ProfileDetailsSnapshot,
} from '../pages/profile.page';

type ProfileCleanupFixtures = {
  /** POM for My Profile; same page as the test. */
  profilePage: ProfilePage;
  /**
   * Snapshots Your details before the test and restores them after
   * (display name + phone via Save my details). Opt in by using this fixture.
   */
  profileDetailsBaseline: ProfileDetailsSnapshot;
};

/**
 * Extends the base test with Profile Your-details snapshot/restore teardown.
 * Use `profileDetailsBaseline` in any test that mutates display name or phone.
 */
export const test = base.extend<ProfileCleanupFixtures>({
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  profileDetailsBaseline: async ({ profilePage }, use) => {
    await profilePage.goto();
    const baseline = await profilePage.readMyDetails();
    await use(baseline);
    await profilePage.goto();
    await profilePage.restoreMyDetails(baseline);
  },
});

export { expect };
export type { ProfileDetailsSnapshot };
