import { Locator, Page, expect } from '@playwright/test';

/** The single <ngb-toast> in app-toast. It hides itself after 3 seconds; errors get .bg-danger. */
export class Toast {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('ngb-toast');
  }

  async expectSuccess(text: string | RegExp): Promise<void> {
    await expect(this.root).toContainText(text);
    await expect(this.root).not.toHaveClass(/bg-danger/);
  }

  async expectError(text: string | RegExp): Promise<void> {
    await expect(this.root).toContainText(text);
    await expect(this.root).toHaveClass(/bg-danger/);
  }
}
