import { expect, test } from '../fixtures/test';

test.describe('viewer (read-only) role', { tag: '@rbac' }, () => {
  test.use({ role: 'Viewer' });

  test.describe('can see everything', () => {
    test('dashboard greets the viewer and shows the same figures', async ({ dashboard, shell }) => {
      await dashboard.goto();
      await expect(dashboard.heading).toHaveText('Welcome back, Viewer');
      await expect(shell.who).toHaveText('Viewer · Viewer');
      await expect(dashboard.kpi('Open orders')).toHaveText('3');
      await expect(dashboard.reorderAlerts).toHaveCount(3);
      await expect(dashboard.movements).toHaveCount(5);
    });

    test('can search products and open their details', async ({ products }) => {
      await products.goto();
      await products.search.fill('brk');
      await expect(products.grid.rows).toHaveCount(2);

      await products.grid.open('BRK-1044');
      await expect(products.detail.title).toHaveText('Mounting bracket, 90 deg');
      await expect(products.detail.value('On hand')).toHaveText('310 pcs');
      await products.detail.close.click();
      await expect(products.detail.root).toBeHidden();
    });

    test('can filter stock and page through it', async ({ stock }) => {
      await stock.goto();
      await stock.toggleOnlyLow();
      await expect(stock.grid.rows).toHaveCount(3);
      await stock.toggleOnlyLow();
      await stock.grid.nextPage();
      await expect(stock.grid.rows).toHaveCount(2);
      await expect(stock.movements).toHaveCount(5);
    });

    test('can filter orders and read an order', async ({ orders }) => {
      await orders.goto();
      await orders.filter('Delivered');
      await expect(orders.grid.rows).toHaveCount(2);

      await orders.open('SO-2413');
      await expect(orders.detail.lines).toHaveCount(1);
      await expect(orders.detail.lines.first()).toContainText('PNL-4010');
      await expect(orders.detail.total).toHaveText('Total $1,360.00');
    });
  });

  // The UI disables these buttons, but the rule also lives in the services (AuthService.requireManager).
  // These tests switch a disabled button back on, as someone tampering with the page could, and check that
  // the change is still refused.
  test.describe('the rules hold even if a disabled button is forced on', () => {
    const enable = (button: import('@playwright/test').Locator) =>
      button.evaluate(el => el.removeAttribute('disabled'));

    test('adding a product is refused', async ({ products, toast }) => {
      await products.goto();
      await enable(products.newProduct);
      await products.newProduct.click();
      await products.form.fill({
        sku: 'HCK-0001', name: 'Forced product', category: 'Test', cost: 1, price: 2,
        bin: 'Z-00-0', supplier: 'Nobody'
      });
      await products.form.submit.click();

      await toast.expectError('Only managers can make this change.');
      await products.form.cancel.click();
      await products.search.fill('HCK-0001');
      await expect(products.grid.rows).toHaveCount(0);
    });

    test('creating an order is refused', async ({ orders, toast }) => {
      await orders.goto();
      await enable(orders.newOrder);
      await orders.newOrder.click();
      await orders.form.fill('Forced Co', '2026-12-01', [{ sku: 'BRK-1020', qty: 1 }]);
      await orders.form.submit.click();

      await toast.expectError('Only managers can make this change.');
      await orders.form.root.getByRole('button', { name: 'Cancel' }).click();
      await expect(orders.grid.row('SO-2419')).toHaveCount(0);
    });

    test('adjusting stock is refused', { tag: '@smoke' }, async ({ stock, toast }) => {
      await stock.goto();
      await stock.grid.open('BRK-1020');
      // the whole adjust form is disabled for viewers: switch the quantity field and the button back on
      await enable(stock.detail.qty);
      await stock.detail.qty.fill('5');
      await enable(stock.detail.apply);
      await stock.detail.apply.click();

      await toast.expectError('Only managers can make this change.');
      await stock.detail.close.click();
      await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('1,240');
    });
  });

  test.describe('cannot change anything', () => {
    test('New product is disabled', async ({ products }) => {
      await products.goto();
      await expect(products.newProduct).toBeDisabled();
    });

    test('New order is disabled', async ({ orders }) => {
      await orders.goto();
      await expect(orders.newOrder).toBeDisabled();
    });

    test('stock adjustment is locked on the products page', { tag: '@smoke' }, async ({ products }) => {
      await products.goto();
      await products.grid.open('BRK-1020');

      await expect(products.detail.qty).toBeDisabled();
      await expect(products.detail.reason).toBeDisabled();
      await expect(products.detail.apply).toBeDisabled();
      await expect(products.detail.root.getByText('Viewers cannot adjust stock.')).toBeVisible();
    });

    test('stock adjustment is locked on the stock page', async ({ stock }) => {
      await stock.goto();
      await stock.grid.open('FST-2015');
      await expect(stock.detail.apply).toBeDisabled();
      await expect(stock.detail.qty).toBeDisabled();
    });

    test('stock adjustment is locked from a dashboard reorder alert', async ({ dashboard }) => {
      await dashboard.goto();
      await dashboard.reorderAlerts.filter({ hasText: 'BRK-1044' }).click();
      await expect(dashboard.productModal.apply).toBeDisabled();
      await expect(dashboard.productModal.root.getByText('Viewers cannot adjust stock.')).toBeVisible();
    });

    // one order in every status: the viewer never gets a status or cancel button
    for (const [orderNo, status] of [
      ['SO-2414', 'New'],
      ['SO-2417', 'Confirmed'],
      ['SO-2418', 'Picking'],
      ['SO-2416', 'Shipped'],
      ['SO-2413', 'Delivered'],
      ['SO-2411', 'Cancelled']
    ]) {
      test(`no order actions on a ${status} order (${orderNo})`, async ({ orders }) => {
        await orders.goto();
        await orders.filter(status as any);
        await orders.open(orderNo);
        await expect(orders.detail.moveTo).toHaveCount(0);
        await expect(orders.detail.cancelOrder).toHaveCount(0);
        await expect(orders.detail.close).toBeEnabled();
      });
    }
  });
});
