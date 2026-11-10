import { Locator, Page } from '@playwright/test';

import { Grid } from './grid';
import { ProductDetailModal } from './product-detail.modal';

export interface NewProduct {
  sku: string;
  name: string;
  category: string;
  unit?: 'pcs' | 'box/100' | 'kg' | 'm';
  cost: number;
  price: number;
  stock?: number;
  minLevel?: number;
  maxLevel?: number;
  bin: string;
  supplier: string;
}

/** ProductFormComponent ("New product" modal). */
export class ProductFormModal {
  readonly root: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;

  constructor(private page: Page) {
    this.root = page.getByRole('dialog');
    this.submit = this.root.getByRole('button', { name: 'Add product' });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
  }

  field(label: string): Locator {
    return this.root.getByLabel(label, { exact: true });
  }

  /** Bootstrap's .invalid-feedback next to a field; only visible when the field is invalid and touched. */
  feedback(label: string): Locator {
    // a `has` locator is searched for inside each .form-group, so it must not start from the dialog again
    return this.root
      .locator('.form-group', { has: this.page.getByLabel(label, { exact: true }) })
      .locator('.invalid-feedback');
  }

  async fill(p: NewProduct): Promise<void> {
    await this.field('SKU').fill(p.sku);
    await this.field('Name').fill(p.name);
    await this.field('Category').fill(p.category);
    await this.field('Unit').selectOption(p.unit || 'pcs');
    await this.field('Unit cost').fill(String(p.cost));
    await this.field('Unit price').fill(String(p.price));
    if (p.stock !== undefined) {
      await this.field('Opening stock').fill(String(p.stock));
    }
    if (p.minLevel !== undefined) {
      await this.field('Reorder at').fill(String(p.minLevel));
    }
    if (p.maxLevel !== undefined) {
      await this.field('Max level').fill(String(p.maxLevel));
    }
    await this.field('Bin').fill(p.bin);
    await this.field('Supplier').fill(p.supplier);
  }
}

export class ProductsPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly newProduct: Locator;
  readonly grid: Grid;
  readonly form: ProductFormModal;
  readonly detail: ProductDetailModal;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Products', level: 1 });
    this.search = page.getByRole('searchbox', { name: 'Search products' });
    this.newProduct = page.getByRole('button', { name: 'New product' });
    this.grid = new Grid(page.locator('app-grid'));
    this.form = new ProductFormModal(page);
    this.detail = new ProductDetailModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
    await this.grid.rows.first().waitFor();
  }
}
