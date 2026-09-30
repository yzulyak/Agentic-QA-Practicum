import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly logInButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
    this.signUpLink = page.getByRole('link', { name: 'Sign up' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  /** Navigates to the Log in page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Login);
  }

  /** Fills the email field. */
  async fillEmail(email: string): Promise<void> {
    await this.email.fill(email);
  }

  /** Fills the password field. */
  async fillPassword(password: string): Promise<void> {
    await this.password.fill(password);
  }

  /** Submits the Log in form. */
  async submit(): Promise<void> {
    await this.logInButton.click();
  }

  /** Signs in with the given credentials. */
  async logIn(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /** Opens the Sign up page. */
  async openSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  /** Opens the Forgot password page. */
  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
