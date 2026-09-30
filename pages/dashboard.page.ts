import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/header.component';
import { AppRoute } from '../test-data/routes';

export class DashboardPage {
  readonly header: HeaderComponent;
  readonly greetingHeading: Locator;
  readonly setupPrompt: Locator;
  readonly confirmEmailHeading: Locator;
  readonly resendLinkButton: Locator;
  readonly familyName: Locator;
  readonly createFamilyButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.greetingHeading = page.getByRole('heading', { level: 2 });
    this.setupPrompt = page.getByText('Start by setting up your family below.');
    this.confirmEmailHeading = page.getByText('Confirm your email', { exact: true });
    this.resendLinkButton = page.getByRole('button', { name: 'Resend link' });
    this.familyName = page.getByRole('textbox', { name: 'Family name' });
    this.createFamilyButton = page.getByRole('button', { name: 'Create', exact: true });
  }

  /** Navigates to the Dashboard. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Dashboard);
  }

  /** Fills the Family name field without creating. */
  async fillFamilyName(name: string): Promise<void> {
    await this.familyName.fill(name);
  }
}
