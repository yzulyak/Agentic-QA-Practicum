import { DashboardPage, LoginPage } from '../pages';
import { test, expect } from '../fixtures/profile-cleanup.fixture';
import { ALT_AUTH_FILE, AUTH_FILE } from '../support/auth.constants';
import {
  DASHBOARD_BANNER_TITLE,
  FAMILY_SETUP_PROMPT,
  FamilyFirstName,
  GreetingPrefix,
  SummaryCardLabel,
} from '../test-data/dashboard';
import { AppRoute } from '../test-data/routes';
import { invalidFamily } from '../test-data/invalid-family';

// AQPBT-2 has no AC-defined invalid Family name values; keep the empty set wired.
void invalidFamily;

function greetingPattern(prefix: GreetingPrefix, firstName: FamilyFirstName): RegExp {
  return new RegExp(`^${prefix}, ${firstName}! 👋$`);
}

test.describe('Dashboard greeting and summary stats', () => {
  test('shows first-name greeting and Dashboard banner @smoke', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T15:00:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
    );
    await expect(dashboard.bannerTitle).toHaveText(DASHBOARD_BANNER_TITLE);
  });

  test('greeting is Good morning before noon @sanity', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T09:00:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Morning, FamilyFirstName.FamilyA),
    );
  });

  test('greeting is Good afternoon from noon through 17:59 @sanity', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
    );
  });

  test('greeting is Good evening from 18:00 through 23:59 @sanity', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T18:00:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Evening, FamilyFirstName.FamilyA),
    );
  });

  test('shows family setup subtitle when family is not set up @sanity', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.setupPrompt).toHaveText(FAMILY_SETUP_PROMPT);
  });

  test('empty summary cards show zero for all four labels @sanity', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect.soft(dashboard.cardLabel(dashboard.myKidsCard, SummaryCardLabel.MyKids)).toBeVisible();
    await expect.soft(dashboard.summaryCount(dashboard.myKidsCard, '0')).toBeVisible();

    await expect
      .soft(dashboard.cardLabel(dashboard.familiesInCircleCard, SummaryCardLabel.FamiliesInCircle))
      .toBeVisible();
    await expect.soft(dashboard.summaryCount(dashboard.familiesInCircleCard, '0')).toBeVisible();

    await expect
      .soft(dashboard.cardLabel(dashboard.playdatesCard, SummaryCardLabel.Playdates))
      .toBeVisible();
    await expect.soft(dashboard.summaryCount(dashboard.playdatesCard, '0')).toBeVisible();

    await expect
      .soft(
        dashboard.cardLabel(dashboard.birthdaysThisMonthCard, SummaryCardLabel.BirthdaysThisMonth),
      )
      .toBeVisible();
    await expect(dashboard.summaryCount(dashboard.birthdaysThisMonthCard, '0')).toBeVisible();
  });

  test('Family B greeting uses Yaroslav2 and own zero stats @e2e', async ({ browser }) => {
    test.skip(
      !process.env.APP_ALT_USER_EMAIL || !process.env.APP_ALT_USER_PASSWORD,
      'APP_ALT_USER_EMAIL / APP_ALT_USER_PASSWORD unset',
    );

    const altContext = await browser.newContext({ storageState: ALT_AUTH_FILE });
    const altPage = await altContext.newPage();
    const dashboard = new DashboardPage(altPage);

    try {
      await altPage.clock.setFixedTime(new Date('2026-10-05T15:00:00-04:00'));
      await dashboard.goto();

      await expect(dashboard.greetingHeading).toHaveText(
        greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyB),
      );
      await expect(dashboard.greetingHeading).not.toContainText(`${FamilyFirstName.FamilyA}!`);
      await expect.soft(dashboard.summaryCount(dashboard.myKidsCard, '0')).toBeVisible();
      await expect.soft(dashboard.summaryCount(dashboard.familiesInCircleCard, '0')).toBeVisible();
      await expect.soft(dashboard.summaryCount(dashboard.playdatesCard, '0')).toBeVisible();
      await expect(dashboard.summaryCount(dashboard.birthdaysThisMonthCard, '0')).toBeVisible();
    } finally {
      await altContext.close();
    }
  });

  test('summary card clicks leave URL on Dashboard @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(page).toHaveURL(new RegExp(`${AppRoute.Dashboard}$`));

    await dashboard.clickMyKidsCard();
    await expect(page).toHaveURL(new RegExp(`${AppRoute.Dashboard}$`));

    await dashboard.clickFamiliesInCircleCard();
    await expect(page).toHaveURL(new RegExp(`${AppRoute.Dashboard}$`));

    await dashboard.clickPlaydatesCard();
    await expect(page).toHaveURL(new RegExp(`${AppRoute.Dashboard}$`));

    await dashboard.clickBirthdaysThisMonthCard();
    await expect(page).toHaveURL(new RegExp(`${AppRoute.Dashboard}$`));
  });

  test('logs out from an isolated context without ending shared session @regression', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    const dashboard = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    try {
      await dashboard.goto();
      await expect(dashboard.greetingHeading).toBeVisible();
      await dashboard.header.logOut();

      await expect(page).toHaveURL(new RegExp(`${AppRoute.Login}$`));
      await expect(loginPage.heading).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('greeting is Good morning at 00:30 @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T00:30:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Morning, FamilyFirstName.FamilyA),
    );
  });

  test('greeting switches at noon boundary @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await page.clock.setFixedTime(new Date('2026-10-05T11:59:00-04:00'));
    await dashboard.goto();
    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Morning, FamilyFirstName.FamilyA),
    );

    await page.clock.setFixedTime(new Date('2026-10-05T12:00:00-04:00'));
    await dashboard.goto();
    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
    );
  });

  test('greeting switches at evening boundary @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await page.clock.setFixedTime(new Date('2026-10-05T17:59:00-04:00'));
    await dashboard.goto();
    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
    );

    await page.clock.setFixedTime(new Date('2026-10-05T18:00:00-04:00'));
    await dashboard.goto();
    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Evening, FamilyFirstName.FamilyA),
    );
  });

  test('greeting is Good evening at 23:59 @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T23:59:00-04:00'));
    await dashboard.goto();

    await expect(dashboard.greetingHeading).toHaveText(
      greetingPattern(GreetingPrefix.Evening, FamilyFirstName.FamilyA),
    );
  });

  test('Family A and Family B greetings stay isolated @e2e', async ({ page, browser }) => {
    test.skip(
      !process.env.APP_ALT_USER_EMAIL || !process.env.APP_ALT_USER_PASSWORD,
      'APP_ALT_USER_EMAIL / APP_ALT_USER_PASSWORD unset',
    );

    const familyA = new DashboardPage(page);
    await page.clock.setFixedTime(new Date('2026-10-05T15:00:00-04:00'));
    await familyA.goto();

    const altContext = await browser.newContext({ storageState: ALT_AUTH_FILE });
    const altPage = await altContext.newPage();
    const familyB = new DashboardPage(altPage);

    try {
      await altPage.clock.setFixedTime(new Date('2026-10-05T15:00:00-04:00'));
      await familyB.goto();

      await expect(familyA.greetingHeading).toHaveText(
        greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
      );
      await expect(familyA.greetingHeading).not.toContainText(FamilyFirstName.FamilyB);

      await expect(familyB.greetingHeading).toHaveText(
        greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyB),
      );
      await expect(familyB.greetingHeading).not.toContainText(`${FamilyFirstName.FamilyA}!`);
    } finally {
      await altContext.close();
    }
  });
});

test.describe('logged-out Dashboard gate', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('opens /app logged out and lands on login Welcome back @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    await page.goto(AppRoute.Dashboard);

    await expect(page).toHaveURL(new RegExp(`${AppRoute.Login}$`));
    await expect(loginPage.heading).toBeVisible();
    await expect(dashboard.greetingHeading).toHaveCount(0);
    await expect(dashboard.myKidsCard).toHaveCount(0);
  });
});
