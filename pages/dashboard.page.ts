import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/header.component';
import {
  DASHBOARD_BANNER_TITLE,
  FAMILY_SETUP_PROMPT,
  SummaryCardLabel,
} from '../test-data/dashboard';
import { AppRoute } from '../test-data/routes';

export class DashboardPage {
  readonly header: HeaderComponent;
  readonly bannerTitle: Locator;
  readonly greetingHeading: Locator;
  readonly setupPrompt: Locator;
  readonly confirmEmailHeading: Locator;
  readonly resendLinkButton: Locator;
  readonly familyName: Locator;
  readonly createFamilyButton: Locator;
  readonly myKidsCard: Locator;
  readonly familiesInCircleCard: Locator;
  readonly playdatesCard: Locator;
  readonly birthdaysThisMonthCard: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.bannerTitle = page.getByRole('banner').getByText(DASHBOARD_BANNER_TITLE, {
      exact: true,
    });
    this.greetingHeading = page.getByRole('heading', {
      level: 2,
      name: /Good (morning|afternoon|evening), .+! 👋/,
    });
    this.setupPrompt = page.getByText(FAMILY_SETUP_PROMPT);
    this.confirmEmailHeading = page.getByText('Confirm your email', { exact: true });
    this.resendLinkButton = page.getByRole('button', { name: 'Resend link' });
    this.familyName = page.getByRole('textbox', { name: 'Family name' });
    this.createFamilyButton = page.getByRole('button', { name: 'Create', exact: true });
    this.myKidsCard = this.summaryCard(SummaryCardLabel.MyKids);
    this.familiesInCircleCard = this.summaryCard(SummaryCardLabel.FamiliesInCircle);
    this.playdatesCard = this.summaryCard(SummaryCardLabel.Playdates);
    this.birthdaysThisMonthCard = this.summaryCard(SummaryCardLabel.BirthdaysThisMonth);
  }

  private summaryCard(label: SummaryCardLabel): Locator {
    // Cards are non-landmark div.stat-card blocks; filter by user-facing label.
    return this.page.locator('.stat-card').filter({
      has: this.page.getByText(label, { exact: true }),
    });
  }

  /** Navigates to the Dashboard. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Dashboard);
  }

  /** Fills the Family name field without creating. */
  async fillFamilyName(name: string): Promise<void> {
    await this.familyName.fill(name);
  }

  /**
   * Label text on a summary card.
   * @param card - Summary card locator.
   * @param label - Exact card label from AQPBT-2.
   */
  cardLabel(card: Locator, label: SummaryCardLabel): Locator {
    return card.getByText(label, { exact: true });
  }

  /**
   * Numeric count shown on a summary card.
   * @param card - Summary card locator (e.g. myKidsCard).
   * @param count - Exact count text (AQPBT-2 empty state uses "0").
   */
  summaryCount(card: Locator, count: string): Locator {
    return card.getByText(count, { exact: true });
  }

  /** Clicks the My Kids summary card. */
  async clickMyKidsCard(): Promise<void> {
    await this.myKidsCard.click();
  }

  /** Clicks the Families in Circle summary card. */
  async clickFamiliesInCircleCard(): Promise<void> {
    await this.familiesInCircleCard.click();
  }

  /** Clicks the Playdates summary card. */
  async clickPlaydatesCard(): Promise<void> {
    await this.playdatesCard.click();
  }

  /** Clicks the Birthdays This Month summary card. */
  async clickBirthdaysThisMonthCard(): Promise<void> {
    await this.birthdaysThisMonthCard.click();
  }
}
