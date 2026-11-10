import { expect, test } from '../fixtures/test';
import { NewProduct } from '../pages/products.page';

const newProduct: NewProduct = {
  sku: 'TST-9001',
  name: 'Test spring 20 mm',
  category: 'Springs',
  unit: 'pcs',
  cost: 0.5,
  price: 1.25,
  stock: 50,
  minLevel: 10,
  maxLevel: 200,
  bin: 'F-01-1',
  supplier: 'Playwright Supplies'
};

test.describe('products', { tag: '@products' }, () => {
  test.beforeEach(async ({ products }) => {
    await products.goto();
  });

  test('lists products by SKU, six per page', async ({ products }) => {
    await expect(products.grid.rows).toHaveCount(6);
    expect(await products.grid.columnValues('sku')).toEqual([
      'ASM-6100', 'BRK-1020', 'BRK-1044', 'FST-2001', 'FST-2015', 'GSK-3100'
    ]);

    await products.grid.nextPage();
    await expect(products.grid.rows).toHaveCount(4);
    expect(await products.grid.columnValues('sku')).toEqual(['GSK-3120', 'MTR-5002', 'PNL-4010', 'PNL-4025']);
  });

  test('search filters by name, SKU and category', async ({ products }) => {
    await products.search.fill('gasket');
    await expect(products.grid.rows).toHaveCount(2);
    expect(await products.grid.columnValues('sku')).toEqual(['GSK-3100', 'GSK-3120']);

    await products.search.fill('assemblies');
    await expect(products.grid.rows).toHaveCount(2);
    expect(await products.grid.columnValues('sku')).toEqual(['ASM-6100', 'MTR-5002']);

    await products.search.fill('no such thing');
    await expect(products.grid.rows).toHaveCount(0);
  });

  test('shows the stock status of each product', async ({ products }) => {
    await expect(products.grid.cell('BRK-1020', 'status')).toHaveText('In stock');
    await expect(products.grid.cell('BRK-1044', 'status')).toHaveText('Low');
    await expect(products.grid.cell('BRK-1020', 'price')).toHaveText('$7.50');
    await expect(products.grid.cell('BRK-1020', 'stock')).toHaveText('1,240');
  });

  test('clicking a row opens the product details', async ({ products }) => {
    await products.grid.open('BRK-1020');

    await expect(products.detail.title).toHaveText('Brake bracket, zinc');
    await expect(products.detail.value('On hand')).toHaveText('1,240 pcs');
    await expect(products.detail.value('Bin')).toHaveText('A-03-2');
    await expect(products.detail.value('Supplier')).toHaveText('Northline Steel');
  });

  test('manager adds a new product', { tag: '@smoke' }, async ({ products, toast }) => {
    await products.newProduct.click();
    await products.form.fill(newProduct);
    await products.form.submit.click();

    await toast.expectSuccess('TST-9001 added.');
    await expect(products.form.root).toBeHidden();

    await products.search.fill('TST-9001');
    await expect(products.grid.rows).toHaveCount(1);
    await expect(products.grid.cell('TST-9001', 'name')).toHaveText(newProduct.name);
    await expect(products.grid.cell('TST-9001', 'status')).toHaveText('In stock');
  });

  test('a SKU in the wrong format is rejected', async ({ products }) => {
    await products.newProduct.click();
    await products.form.fill({ ...newProduct, sku: 'tst-12' });
    await products.form.submit.click();

    await expect(products.form.feedback('SKU')).toBeVisible();
    await expect(products.form.feedback('SKU')).toHaveText('Use the format ABC-1234.');
    await expect(products.form.root).toBeVisible();
  });

  test('required fields are flagged when the form is submitted empty', async ({ products }) => {
    await products.newProduct.click();
    await products.form.submit.click();

    await expect(products.form.feedback('Name')).toBeVisible();
    await expect(products.form.feedback('Category')).toBeVisible();
    await expect(products.form.feedback('Bin')).toBeVisible();
    await expect(products.form.feedback('Supplier')).toBeVisible();
  });

  test('search ignores case and matches part of a SKU', async ({ products }) => {
    await products.search.fill('BrK-10');
    await expect(products.grid.rows).toHaveCount(2);
    expect(await products.grid.columnValues('sku')).toEqual(['BRK-1020', 'BRK-1044']);

    await products.search.fill('');
    await expect(products.grid.rows).toHaveCount(6);
  });

  test('clicking a column header sorts the grid', async ({ products }) => {
    await products.grid.sortBy('price');
    await expect(products.grid.rows).toHaveCount(6);
    expect((await products.grid.columnValues('sku'))[0]).toBe('GSK-3100'); // cheapest, $2.40

    await products.grid.sortBy('price');
    expect((await products.grid.columnValues('sku'))[0]).toBe('ASM-6100'); // most expensive, $410
  });

  test('sorting by status puts empty and low stock first', async ({ products }) => {
    await products.grid.sortBy('status');
    // sorted by on hand / reorder level: PNL-4025 0/20 = 0, BRK-1044 310/500 = 0.62, FST-2015 42/60 = 0.7, ...
    expect((await products.grid.columnValues('sku')).slice(0, 3)).toEqual(['PNL-4025', 'BRK-1044', 'FST-2015']);
  });

  test('adjusting stock from the products page refreshes the grid', async ({ products, toast }) => {
    await products.grid.open('BRK-1044');
    await products.detail.adjust(200, 'Delivery');
    await toast.expectSuccess('BRK-1044 now has 510 on hand.');
    await expect(products.grid.cell('BRK-1044', 'stock')).toHaveText('510');
    await expect(products.grid.cell('BRK-1044', 'status')).toHaveText('In stock');
  });

  for (const [field, value, message] of [
    ['Name', 'x'.repeat(61), 'Enter a name of up to 60 characters.'],
    ['Unit cost', '-1', 'Enter 0 or more.'],
    ['Unit price', '-0.01', 'Enter 0 or more.'],
    ['Max level', '0', 'Enter 1 or more.']
  ]) {
    test(`rejects ${field} = "${value.length > 10 ? value.length + ' characters' : value}"`, async ({ products }) => {
      await products.newProduct.click();
      await products.form.fill(newProduct);
      await products.form.field(field).fill(value);
      await products.form.submit.click();

      await expect(products.form.feedback(field)).toBeVisible();
      await expect(products.form.feedback(field)).toHaveText(message);
      await expect(products.form.root).toBeVisible();
    });
  }

  test('cancel and the close button discard the new product', async ({ products }) => {
    await products.newProduct.click();
    await products.form.fill(newProduct);
    await products.form.cancel.click();
    await expect(products.form.root).toBeHidden();

    await products.newProduct.click();
    await products.form.fill(newProduct);
    await products.form.root.getByRole('button', { name: 'Close' }).click();
    await expect(products.form.root).toBeHidden();

    await products.search.fill('TST-9001');
    await expect(products.grid.rows).toHaveCount(0);
  });

  test('a new product shows up on the stock page and in the order form', async ({ products, toast, shell, stock, orders }) => {
    await products.newProduct.click();
    await products.form.fill({ ...newProduct, stock: 5, minLevel: 10 });
    await products.form.submit.click();
    await toast.expectSuccess('TST-9001 added.');

    await shell.goTo('Stock');
    await stock.toggleOnlyLow();
    await expect(stock.grid.cell('TST-9001', 'status')).toHaveText('Low');

    await shell.goTo('Orders');
    await orders.newOrder.click();
    await expect(orders.form.product(0).locator('option', { hasText: 'TST-9001' })).toHaveCount(1);
  });

  test('a duplicate SKU is refused', { tag: '@smoke' }, async ({ products, toast }) => {
    await products.newProduct.click();
    await products.form.fill({ ...newProduct, sku: 'BRK-1020' });
    await products.form.submit.click();

    await toast.expectError('SKU BRK-1020 already exists.');
    await expect(products.form.root).toBeVisible();
  });
});
