import { Locator, Page } from '@playwright/test';

import { ProductDetailModal } from './product-detail.modal';

export class DashboardPage {
  readonly heading: Locator;
  readonly reorderAlerts: Locator;
  readonly movements: Locator;
  readonly productModal: ProductDetailModal;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.reorderAlerts = page.locator('.card', { hasText: 'Reorder alerts' }).locator('button.list-group-item');
    this.movements = page.locator('.card', { hasText: 'Recent stock movements' }).locator('li.list-group-item');
    this.productModal = new ProductDetailModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  /** Value of a KPI tile, by its label, e.g. 'Open orders'. */
  kpi(label: string): Locator {
    return this.page.locator('.kpi').filter({ has: this.page.getByText(label, { exact: true }) }).locator('b');
  }
}
