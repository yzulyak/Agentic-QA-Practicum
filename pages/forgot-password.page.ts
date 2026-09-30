import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class ForgotPasswordPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly sendResetLinkButton: Locator;
  readonly backToLogInLink: Locator;
  readonly instructions: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Reset your password' });
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.sendResetLinkButton = page.getByRole('button', { name: 'Send reset link' });
    this.backToLogInLink = page.getByRole('link', { name: '← Back to log in' });
    this.instructions = page.getByText('Enter your email and we’ll send you a reset link.');
  }

  /** Navigates to the Forgot password page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.ForgotPassword);
  }

  /** Fills the Email field without submitting. */
  async fillEmail(email: string): Promise<void> {
    await this.email.fill(email);
  }

  /** Returns to the Log in page. */
  async openBackToLogIn(): Promise<void> {
    await this.backToLogInLink.click();
  }
}
