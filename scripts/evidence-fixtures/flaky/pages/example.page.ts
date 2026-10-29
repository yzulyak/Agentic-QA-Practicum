import type { Page, Locator } from '@playwright/test';

export class ExamplePage {
  readonly heading: Locator;
  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Family' });
  }
}
