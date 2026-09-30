import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class LandingPage {
  readonly getStartedLink: Locator;
  readonly logInLink: Locator;
  readonly privacyLink: Locator;
  readonly termsLink: Locator;
  readonly tagline: Locator;

  constructor(private readonly page: Page) {
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.logInLink = page.getByRole('link', { name: 'Log in', exact: true });
    this.privacyLink = page.getByRole('link', { name: 'Privacy' });
    this.termsLink = page.getByRole('link', { name: 'Terms' });
    this.tagline = page.getByText("See when your kids' friends are free");
  }

  /** Navigates to the public landing page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Home);
  }

  /** Opens the Sign up flow via Get started. */
  async openGetStarted(): Promise<void> {
    await this.getStartedLink.click();
  }

  /** Opens the Log in page. */
  async openLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
