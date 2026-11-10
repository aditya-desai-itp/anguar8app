import { Locator, Page } from '@playwright/test';

import { Grid } from './grid';

export type OrderStatus = 'New' | 'Confirmed' | 'Picking' | 'Shipped' | 'Delivered' | 'Cancelled';

/** OrderFormComponent ("New order" modal). */
export class OrderFormModal {
  readonly root: Locator;
  readonly customer: Locator;
  readonly due: Locator;
  readonly addLine: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.customer = this.root.getByLabel('Customer');
    this.due = this.root.getByLabel('Due date');
    this.addLine = this.root.getByRole('button', { name: 'Add line' });
    this.submit = this.root.getByRole('button', { name: 'Create order' });
  }

  product(line: number): Locator {
    return this.root.locator(`#of-sku-${line}`);
  }

  qty(line: number): Locator {
    return this.root.locator(`#of-qty-${line}`);
  }

  /**
   * @param due yyyy-mm-dd; ngbDatepicker parses typed ISO dates, so the calendar pop-up is not needed.
   * @param lines product SKU and quantity; extra lines are added as needed.
   */
  async fill(customer: string, due: string, lines: { sku: string; qty: number }[]): Promise<void> {
    await this.customer.fill(customer);
    await this.due.fill(due);
    await this.due.blur();
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        await this.addLine.click();
      }
      await this.product(i).selectOption(lines[i].sku);
      await this.qty(i).fill(String(lines[i].qty));
    }
  }
}

/** OrderDetailComponent: lines, status steps and the next-step / cancel buttons. */
export class OrderDetailModal {
  readonly root: Locator;
  readonly title: Locator;
  readonly currentStep: Locator;
  readonly lines: Locator;
  readonly total: Locator;
  readonly cancelOrder: Locator;
  readonly moveTo: Locator;
  readonly close: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.title = this.root.locator('.modal-title');
    this.currentStep = this.root.locator('.steps .cur');
    this.lines = this.root.locator('tbody tr');
    this.total = this.root.getByText(/^Total /);
    this.cancelOrder = this.root.getByRole('button', { name: 'Cancel order' });
    this.moveTo = this.root.getByRole('button', { name: /^Move to / });
    this.close = this.root.locator('.modal-footer').getByRole('button', { name: 'Close' });
  }

  moveToButton(status: OrderStatus): Locator {
    return this.root.getByRole('button', { name: `Move to ${status}` });
  }
}

export class OrdersPage {
  readonly heading: Locator;
  readonly statusFilter: Locator;
  readonly newOrder: Locator;
  readonly grid: Grid;
  readonly form: OrderFormModal;
  readonly detail: OrderDetailModal;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Customer orders', level: 1 });
    this.statusFilter = page.getByRole('combobox', { name: 'Filter by status' });
    this.newOrder = page.getByRole('button', { name: 'New order' });
    this.grid = new Grid(page.locator('app-grid'));
    this.form = new OrderFormModal(page);
    this.detail = new OrderDetailModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/orders');
    await this.grid.rows.first().waitFor();
  }

  async filter(status: OrderStatus | ''): Promise<void> {
    await this.statusFilter.selectOption(status === '' ? { label: 'All statuses' } : { label: status });
  }

  async open(orderNo: string): Promise<void> {
    await this.grid.open(orderNo);
    await this.detail.title.filter({ hasText: orderNo }).waitFor();
    // the lines load after a short delay (respond() in the app adds 120 ms)
    await this.detail.lines.first().waitFor();
  }
}
