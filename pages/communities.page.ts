import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/header.component';
import { AppRoute } from '../test-data/routes';

export class CommunitiesPage {
  readonly header: HeaderComponent;
  readonly setupRequiredMessage: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.setupRequiredMessage = page.getByText(
      'Set up your family on the Dashboard before joining a group.',
    );
  }

  /** Navigates to the Communities page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Communities);
  }
}
