import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/header.component';
import { AppRoute } from '../test-data/routes';

export class CalendarPage {
  readonly header: HeaderComponent;
  readonly familyCalendarLabel: Locator;
  readonly thisWeekHeading: Locator;
  readonly noPlansMessage: Locator;
  readonly birthdaysThisMonthHeading: Locator;
  readonly noBirthdaysMessage: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.familyCalendarLabel = page.getByText('Your family calendar');
    this.thisWeekHeading = page.getByText('This week', { exact: true });
    this.noPlansMessage = page.getByText('No plans in the next 7 days.');
    this.birthdaysThisMonthHeading = page.getByText('Birthdays this month');
    this.noBirthdaysMessage = page.getByText(/No birthdays in /);
  }

  /** Navigates to the Calendar page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Calendar);
  }
}
