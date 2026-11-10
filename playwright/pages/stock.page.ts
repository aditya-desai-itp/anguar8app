import { Locator, Page } from '@playwright/test';

import { Grid } from './grid';
import { ProductDetailModal } from './product-detail.modal';

export class StockPage {
  readonly heading: Locator;
  readonly onlyLow: Locator;
  readonly grid: Grid;
  readonly movements: Locator;
  readonly detail: ProductDetailModal;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Stock levels', level: 1 });
    this.onlyLow = page.getByLabel('Show only items below reorder level');
    this.grid = new Grid(page.locator('app-grid'));
    this.movements = page.locator('.card', { hasText: 'Latest movements' }).locator('li.list-group-item');
    this.detail = new ProductDetailModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/stock');
    await this.grid.rows.first().waitFor();
  }

  /** The checkbox is a Bootstrap custom switch; the real input is visually hidden, so click its label. */
  async toggleOnlyLow(): Promise<void> {
    await this.page.getByText('Show only items below reorder level').click();
  }
}
