import { type Locator, type Page } from '@playwright/test';

/** Shared signed-in chrome: sidebar navigation plus top banner actions. */
export class HeaderComponent {
  readonly dashboardLink: Locator;
  readonly calendarLink: Locator;
  readonly friendsLink: Locator;
  readonly communitiesLink: Locator;
  readonly availabilityLink: Locator;
  readonly playdatesLink: Locator;
  readonly birthdaysLink: Locator;
  readonly discoverButton: Locator;
  readonly myProfileLink: Locator;
  readonly goPremiumButton: Locator;
  readonly notificationsButton: Locator;
  readonly logOutButton: Locator;

  constructor(private readonly page: Page) {
    const nav = page.getByRole('navigation');
    this.dashboardLink = nav.getByRole('link', { name: 'Dashboard' });
    this.calendarLink = nav.getByRole('link', { name: 'Calendar' });
    this.friendsLink = nav.getByRole('link', { name: 'Friends' });
    this.communitiesLink = nav.getByRole('link', { name: 'Communities' });
    this.availabilityLink = nav.getByRole('link', { name: 'Availability' });
    this.playdatesLink = nav.getByRole('link', { name: 'Playdates' });
    this.birthdaysLink = nav.getByRole('link', { name: 'Birthdays' });
    this.discoverButton = nav.getByRole('button', { name: 'Discover' });
    this.myProfileLink = nav.getByRole('link', { name: 'My Profile' });
    this.goPremiumButton = page.getByRole('button', { name: 'Go Premium' });
    const banner = page.getByRole('banner');
    this.notificationsButton = banner.getByRole('button', { name: 'Notifications', exact: true });
    this.logOutButton = banner.getByRole('button', { name: 'Log out' });
  }

  /** Opens the Dashboard from the main navigation. */
  async openDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  /** Opens the Calendar from the main navigation. */
  async openCalendar(): Promise<void> {
    await this.calendarLink.click();
  }

  /** Opens Friends from the main navigation. */
  async openFriends(): Promise<void> {
    await this.friendsLink.click();
  }

  /** Opens Communities from the main navigation. */
  async openCommunities(): Promise<void> {
    await this.communitiesLink.click();
  }

  /** Opens Availability from the main navigation. */
  async openAvailability(): Promise<void> {
    await this.availabilityLink.click();
  }

  /** Opens Playdates from the main navigation. */
  async openPlaydates(): Promise<void> {
    await this.playdatesLink.click();
  }

  /** Opens Birthdays from the main navigation. */
  async openBirthdays(): Promise<void> {
    await this.birthdaysLink.click();
  }

  /** Opens My Profile from the main navigation. */
  async openMyProfile(): Promise<void> {
    await this.myProfileLink.click();
  }

  /** Triggers community Discover (toast-only for now). */
  async openDiscover(): Promise<void> {
    await this.discoverButton.click();
  }

  /** Triggers Go Premium (toast-only for now). */
  async openGoPremium(): Promise<void> {
    await this.goPremiumButton.click();
  }

  /** Opens the banner Notifications control. */
  async openNotifications(): Promise<void> {
    await this.notificationsButton.click();
  }

  /** Logs out via the banner Log out control. */
  async logOut(): Promise<void> {
    await this.logOutButton.click();
  }
}
