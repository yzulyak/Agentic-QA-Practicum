import { type Locator, type Page } from '@playwright/test';

/** Expanded Danger-zone confirmation after choosing Delete account…. */
export class DeleteAccountForm {
  readonly password: Locator;
  readonly deleteForeverButton: Locator;
  readonly keepMyAccountButton: Locator;

  constructor(private readonly page: Page) {
    this.password = page.getByRole('textbox', { name: 'Your password' });
    this.deleteForeverButton = page.getByRole('button', { name: 'Delete forever' });
    this.keepMyAccountButton = page.getByRole('button', { name: 'Keep my account' });
  }

  /** Fills the confirmation password field without submitting. */
  async fillPassword(password: string): Promise<void> {
    await this.password.fill(password);
  }

  /** Cancels account deletion and keeps the account. */
  async cancel(): Promise<void> {
    await this.keepMyAccountButton.click();
  }
}
