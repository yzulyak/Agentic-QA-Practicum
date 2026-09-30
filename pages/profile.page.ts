import { type Locator, type Page } from '@playwright/test';
import { DeleteAccountForm } from './components/delete-account.component';
import { HeaderComponent } from './components/header.component';
import { AppRoute } from '../test-data/routes';

export class ProfilePage {
  readonly header: HeaderComponent;
  readonly deleteAccountForm: DeleteAccountForm;
  readonly displayName: Locator;
  readonly phone: Locator;
  readonly saveMyDetailsButton: Locator;
  readonly myAvailabilityButton: Locator;
  readonly privacyAndSafetyButton: Locator;
  readonly notificationsSettingsButton: Locator;
  readonly calendarSyncButton: Locator;
  readonly logOutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly privacyPolicyLink: Locator;
  readonly termsOfServiceLink: Locator;
  readonly addKidsPrompt: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.deleteAccountForm = new DeleteAccountForm(page);
    this.displayName = page.getByRole('textbox', {
      name: 'Display name (how your circle sees you)',
    });
    this.phone = page.getByRole('textbox', { name: 'Phone (optional)' });
    this.saveMyDetailsButton = page.getByRole('button', { name: 'Save my details' });
    this.myAvailabilityButton = page.getByRole('button', { name: 'My Availability' });
    this.privacyAndSafetyButton = page.getByRole('button', { name: 'Privacy & Safety' });
    this.notificationsSettingsButton = page.getByRole('button', {
      name: 'Notifications Push + email',
    });
    this.calendarSyncButton = page.getByRole('button', { name: 'Calendar Sync' });
    // Body Log out (banner Log out lives on HeaderComponent).
    this.logOutButton = page.getByRole('button', { name: 'Log out' }).last();
    this.deleteAccountButton = page.getByRole('button', { name: 'Delete account…' });
    this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy Policy' });
    this.termsOfServiceLink = page.getByRole('link', { name: 'Terms of Service' });
    this.addKidsPrompt = page.getByText('Add kids from the Dashboard.');
  }

  /** Navigates to My Profile. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Profile);
  }

  /** Fills the display name without saving. */
  async fillDisplayName(name: string): Promise<void> {
    await this.displayName.fill(name);
  }

  /** Fills the optional phone field without saving. */
  async fillPhone(phone: string): Promise<void> {
    await this.phone.fill(phone);
  }

  /** Opens My Availability (navigates to Availability). */
  async openMyAvailability(): Promise<void> {
    await this.myAvailabilityButton.click();
  }

  /** Opens Privacy & Safety (toast-only for now). */
  async openPrivacyAndSafety(): Promise<void> {
    await this.privacyAndSafetyButton.click();
  }

  /** Opens Notifications settings (toast-only for now). */
  async openNotificationsSettings(): Promise<void> {
    await this.notificationsSettingsButton.click();
  }

  /** Opens Calendar Sync (toast-only for now). */
  async openCalendarSync(): Promise<void> {
    await this.calendarSyncButton.click();
  }

  /** Expands the Delete account confirmation form. */
  async openDeleteAccount(): Promise<void> {
    await this.deleteAccountButton.click();
  }

  /** Cancels account deletion via Keep my account. */
  async cancelDeleteAccount(): Promise<void> {
    await this.deleteAccountForm.cancel();
  }
}
