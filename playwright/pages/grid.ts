import { Locator } from '@playwright/test';

/**
 * Wrapper for <app-grid> (ag-Grid 22). Column ids are the keys from each screen's `columns` array,
 * for example 'sku', 'stock', 'status'.
 */
export class Grid {
  readonly rows: Locator;

  constructor(readonly root: Locator) {
    this.rows = root.locator('.ag-center-cols-container .ag-row');
  }

  /** The row that contains the given text, for example a SKU or an order number. */
  row(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  cell(rowText: string, columnId: string): Locator {
    return this.row(rowText).locator(`[col-id="${columnId}"]`);
  }

  /** Text of one column for every row on the current page, in display order. */
  async columnValues(columnId: string): Promise<string[]> {
    const rows = await this.rows.all();
    const withIndex = await Promise.all(
      rows.map(async r => ({
        index: Number(await r.getAttribute('row-index')),
        text: ((await r.locator(`[col-id="${columnId}"]`).textContent()) || '').trim()
      }))
    );
    return withIndex.sort((a, b) => a.index - b.index).map(r => r.text);
  }

  async open(rowText: string): Promise<void> {
    await this.row(rowText).locator('.ag-cell').first().click();
  }

  /** Clicks a column header; each click switches between ascending, descending and unsorted. */
  async sortBy(columnId: string): Promise<void> {
    await this.root.locator(`.ag-header-cell[col-id="${columnId}"] .ag-header-cell-label`).click();
  }

  async nextPage(): Promise<void> {
    await this.root.locator('[ref="btNext"]').click();
  }

  get pageSummary(): Locator {
    return this.root.locator('.ag-paging-row-summary-panel');
  }
}
