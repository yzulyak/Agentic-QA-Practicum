---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this project. Apply whenever generating, refactoring, or reviewing any Playwright test that interacts with the app under test (BuddyTime) — even if the user doesn't say "POM". Tests should never contain inline locators.
paths: "tests/**, pages/**"
---

# POM Conventions

Page Object Model conventions for BuddyTime Playwright tests. Specs never contain inline locators.

## Steps

1. One class per page or distinct component.
2. Locators as `readonly` properties set in the constructor (`getByRole`, `getByLabel`, `getByText` — never CSS).
3. Methods for user actions that do not assert; no `expect()` in `pages/`.
4. Compose components inside pages (e.g. `header: HeaderComponent`).
5. Specs import POMs and instantiate them with `new XxxPage(page)`.

## BuddyTime page inventory

Filled from page objects that exist in `pages/` today. Routes from `test-data/routes.ts` (`AppRoute`).

| route | page object | notes |
| --- | --- | --- |
| `/` | `LandingPage` | Public landing; Get started / Log in |
| `/login` | `LoginPage` | Welcome back; `logIn(email, password)` |
| `/signup` | `SignupPage` | Create your account |
| `/forgot-password` | `ForgotPasswordPage` | Reset your password |
| `/app` | `DashboardPage` | Composes `HeaderComponent`; greeting + summary cards |
| `/calendar` | `CalendarPage` | Composes `HeaderComponent` |
| `/friends` | `FriendsPage` | Composes `HeaderComponent`; family-setup gate message |
| `/communities` | `CommunitiesPage` | Composes `HeaderComponent`; family-setup gate message |
| `/availability` | `AvailabilityPage` | Composes `HeaderComponent`; family-setup gate message |
| `/playdates` | `PlaydatesPage` | Composes `HeaderComponent`; family-setup gate message |
| `/birthdays` | `BirthdaysPage` | Composes `HeaderComponent`; family-setup gate message |
| `/profile` | `ProfilePage` | Composes `HeaderComponent` + `DeleteAccountForm` |
| — | `HeaderComponent` | Shared signed-in chrome (`pages/components/`); held by pages, not extended |
| — | `DeleteAccountForm` | Danger-zone confirm (`pages/components/`); held by `ProfilePage` |

`pages/index.ts` currently re-exports `DashboardPage`, `LoginPage`, and `ProfilePage` only; other page classes import from their file paths.

## Locator rules

- Scope dialog locators to the dialog.
- Use `{ exact: true }` where labels share a prefix.
- Act on rows and cards by accessible name.
- Never hardcode `APP_URL` (pages use relative paths; Playwright's `baseURL` comes from `APP_URL`).
- Shared parts such as the header are components a page holds — never a base class it extends.
- Two-family flows use one page object instance per context.

## Known app issues

Add a row only when the instructor confirms a defect; mark the test with `test.fail(true, '<AQPBT bug key>: <reason>')`.

| AQPBT key | summary | affected page / flow |
| --- | --- | --- |
| | | |

## Output

- Page objects in `pages/`
- Specs in `tests/` that import them

### Example POM (`pages/login.page.ts`)

```typescript
export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly logInButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Login);
  }

  async logIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.logInButton.click();
  }
}
```

### Example spec usage (`tests/aqpbt-2-dashboard-greeting-and-summary-stats.spec.ts`)

```typescript
import { DashboardPage, LoginPage } from '../pages';

test('shows first-name greeting and Dashboard banner @smoke', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await expect(dashboard.greetingHeading).toHaveText(
    greetingPattern(GreetingPrefix.Afternoon, FamilyFirstName.FamilyA),
  );
  await expect(dashboard.bannerTitle).toHaveText(DASHBOARD_BANNER_TITLE);
});
```
