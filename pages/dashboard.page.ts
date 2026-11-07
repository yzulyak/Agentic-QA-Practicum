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

  /** Family card area that lists children under the family name. */
  familyBlock(familyName: string): Locator {
    return this.page.getByText(familyName, { exact: true }).locator('..').locator('..');
  }

  /** Numeric My Kids stat as a locator. */
  myKidsCountLocator(): Locator {
    return this.myKidsCard.getByText(/^\d+$/, { exact: true });
  }

  /** Reads the My Kids summary count. */
  async getMyKidsCount(): Promise<number> {
    const text = await this.myKidsCountLocator().innerText();
    return Number.parseInt(text, 10);
  }

  /**
   * One child row in the family block, located by summary line text.
   * @param familyName - Family name from GET /api/v1/me.
   * @param summaryLine - Child summary (e.g. `Mia, 7 · Girl` or `Mia, 7`).
   */
  childRowBySummary(familyName: string, summaryLine: string): Locator {
    return this.familyBlock(familyName)
      .getByRole('button', { name: 'remove' })
      .locator('..')
      .filter({ hasText: summaryLine });
  }

  /**
   * Summary line text for a child row.
   * @param familyName - Family name from GET /api/v1/me.
   * @param summaryLine - Exact child summary line.
   */
  childSummaryLocator(familyName: string, summaryLine: string): Locator {
    return this.childRowBySummary(familyName, summaryLine).getByText(summaryLine, { exact: true });
  }

  /**
   * Removes a child via the row's remove control.
   * @param familyName - Family name from GET /api/v1/me.
   * @param summaryLine - Exact child summary line.
   */
  async removeChild(familyName: string, summaryLine: string): Promise<void> {
    await this.childRowBySummary(familyName, summaryLine).getByRole('button', { name: 'remove' }).click();
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
