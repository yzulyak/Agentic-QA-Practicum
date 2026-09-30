import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class SignupPage {
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly signUpButton: Locator;
  readonly logInLink: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Create your account' });
    this.name = page.getByRole('textbox', { name: 'Your name' });
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.password = page.getByRole('textbox', { name: 'Password (8+ characters)' });
    this.signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });
    this.logInLink = page.getByRole('link', { name: 'Log in', exact: true });
    this.termsLink = page.getByRole('link', { name: 'Terms of Service' });
    this.privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
  }

  /** Navigates to the Sign up page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Signup);
  }

  /** Fills the Your name field. */
  async fillName(name: string): Promise<void> {
    await this.name.fill(name);
  }

  /** Fills the Email field. */
  async fillEmail(email: string): Promise<void> {
    await this.email.fill(email);
  }

  /** Fills the Password field. */
  async fillPassword(password: string): Promise<void> {
    await this.password.fill(password);
  }

  /** Opens the Log in page from the Sign up form. */
  async openLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
