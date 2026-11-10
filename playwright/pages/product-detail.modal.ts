import { Locator, Page } from '@playwright/test';

/** ProductDetailComponent: opened from the products grid, the stock grid and dashboard reorder alerts. */
export class ProductDetailModal {
  readonly root: Locator;
  readonly title: Locator;
  readonly qty: Locator;
  readonly reason: Locator;
  readonly apply: Locator;
  readonly close: Locator;
  readonly statusPill: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.title = this.root.locator('.modal-title');
    this.qty = this.root.getByLabel('Adjust by (+ or -)');
    this.reason = this.root.getByLabel('Reason');
    this.apply = this.root.getByRole('button', { name: 'Apply' });
    this.close = this.root.locator('.modal-footer').getByRole('button', { name: 'Close' });
    this.statusPill = this.root.locator('.pill');
  }

  /** "On hand", "Reorder at", "Bin", ... from the details list. */
  value(label: string): Locator {
    return this.root.locator('.dl > div').filter({ has: this.root.page().getByText(label, { exact: true }) }).locator('b');
  }

  async adjust(qty: number, reason = 'Playwright test'): Promise<void> {
    await this.qty.fill(String(qty));
    await this.reason.fill(reason);
    await this.apply.click();
  }
}
