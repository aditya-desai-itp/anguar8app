import { expect, test } from '../fixtures/test';

test.describe('orders', { tag: '@orders' }, () => {
  test.beforeEach(async ({ orders }) => {
    await orders.goto();
  });

  test('lists the newest orders first, six per page', async ({ orders }) => {
    expect(await orders.grid.columnValues('no')).toEqual([
      'SO-2418', 'SO-2417', 'SO-2416', 'SO-2415', 'SO-2414', 'SO-2413'
    ]);
    await expect(orders.grid.cell('SO-2418', 'status')).toHaveText('Picking');
    await expect(orders.grid.cell('SO-2418', 'total')).toHaveText('$3,220.00');
  });

  test('sorting by status follows the order flow', async ({ orders }) => {
    await orders.grid.sortBy('status');
    // Cancelled first, then New, Confirmed, Picking, Shipped, Delivered
    expect((await orders.grid.columnValues('status')).slice(0, 4)).toEqual(['Cancelled', 'New', 'Confirmed', 'Picking']);
  });

  test('filters by status', async ({ orders }) => {
    await orders.filter('Shipped');
    await expect(orders.grid.rows).toHaveCount(2);
    expect(await orders.grid.columnValues('no')).toEqual(['SO-2416', 'SO-2415']);

    await orders.filter('Cancelled');
    await expect(orders.grid.rows).toHaveCount(1);
    expect(await orders.grid.columnValues('no')).toEqual(['SO-2411']);

    await orders.filter('');
    await expect(orders.grid.rows).toHaveCount(6);
  });

  test('manager creates an order with two lines', { tag: '@smoke' }, async ({ orders, toast }) => {
    await orders.newOrder.click();
    await orders.form.fill('Acme Test Co', '2026-12-15', [
      { sku: 'BRK-1020', qty: 10 },
      { sku: 'GSK-3100', qty: 100 }
    ]);
    await orders.form.submit.click();

    await toast.expectSuccess('SO-2419 created.');
    await expect(orders.grid.cell('SO-2419', 'customer')).toHaveText('Acme Test Co');
    await expect(orders.grid.cell('SO-2419', 'due')).toHaveText('2026-12-15');
    await expect(orders.grid.cell('SO-2419', 'status')).toHaveText('New');
    // 10 x $7.50 + 100 x $2.40
    await expect(orders.grid.cell('SO-2419', 'total')).toHaveText('$315.00');
  });

  test('an order needs a customer and a due date', async ({ orders }) => {
    await orders.newOrder.click();
    await orders.form.submit.click();

    await expect(orders.form.root.getByText('Enter a customer name.')).toBeVisible();
    await expect(orders.form.root.getByText('Pick a due date.')).toBeVisible();
  });

  test('moves a new order to Confirmed', async ({ orders, toast }) => {
    await orders.open('SO-2414');
    await expect(orders.detail.currentStep).toHaveText('New');

    await orders.detail.moveToButton('Confirmed').click();

    await toast.expectSuccess('SO-2414 is now Confirmed.');
    await expect(orders.detail.currentStep).toHaveText('Confirmed');
    await expect(orders.detail.moveToButton('Picking')).toBeVisible();
    await expect(orders.grid.cell('SO-2414', 'status')).toHaveText('Confirmed');
  });

  test('shipping an order takes its stock out of the warehouse', { tag: '@smoke' }, async ({ orders, toast, shell, stock }) => {
    await orders.open('SO-2418');
    await orders.detail.moveToButton('Shipped').click();
    await toast.expectSuccess('SO-2418 is now Shipped.');
    await orders.detail.close.click();

    await shell.goTo('Stock');
    await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('840'); // 1,240 - 400
    await expect(stock.grid.cell('FST-2001', 'stock')).toHaveText('66'); // 86 - 20
    const picks = stock.movements.filter({ hasText: 'SO-2418' });
    await expect(picks).toHaveCount(2);
    await expect(picks.filter({ hasText: 'BRK-1020' })).toContainText('-400');
  });

  test('an order cannot ship when a product is out of stock', { tag: '@smoke' }, async ({ orders, toast }) => {
    await orders.open('SO-2417');
    await expect(orders.detail.lines.filter({ hasText: 'PNL-4025' })).toContainText('Short: 0 on hand');

    await orders.detail.moveToButton('Picking').click();
    await toast.expectSuccess('SO-2417 is now Picking.');

    await orders.detail.moveToButton('Shipped').click();
    await toast.expectError('Not enough stock of PNL-4025: 0 on hand.');
    await expect(orders.detail.currentStep).toHaveText('Picking');
  });

  test('manager cancels an open order', async ({ orders, toast }) => {
    await orders.open('SO-2414');
    await orders.detail.cancelOrder.click();

    await toast.expectSuccess('SO-2414 was cancelled.');
    await expect(orders.detail.root.getByText('Cancelled', { exact: true })).toBeVisible();
    await expect(orders.detail.moveTo).toHaveCount(0);
    await expect(orders.grid.cell('SO-2414', 'status')).toHaveText('Cancelled');
  });

  test('a shipped order can only move to Delivered', async ({ orders }) => {
    await orders.open('SO-2416');
    await expect(orders.detail.cancelOrder).toHaveCount(0);
    await expect(orders.detail.moveTo).toHaveText('Move to Delivered');
  });

  // which buttons a manager gets in each status
  for (const [orderNo, status, next, canCancel] of [
    ['SO-2414', 'New', 'Confirmed', true],
    ['SO-2417', 'Confirmed', 'Picking', true],
    ['SO-2418', 'Picking', 'Shipped', true],
    ['SO-2416', 'Shipped', 'Delivered', false],
    ['SO-2413', 'Delivered', null, false],
    ['SO-2411', 'Cancelled', null, false]
  ] as const) {
    test(`${status} order (${orderNo}) offers ${next ? 'Move to ' + next : 'no next step'}${canCancel ? ' and Cancel' : ''}`, async ({ orders }) => {
      await orders.filter(status);
      await orders.open(orderNo);

      if (next) {
        await expect(orders.detail.moveTo).toHaveText(`Move to ${next}`);
      } else {
        await expect(orders.detail.moveTo).toHaveCount(0);
      }
      await expect(orders.detail.cancelOrder).toHaveCount(canCancel ? 1 : 0);
    });
  }

  test('an order goes through every step from New to Delivered', async ({ orders, toast, shell, stock }) => {
    await orders.open('SO-2414');
    for (const next of ['Confirmed', 'Picking', 'Shipped', 'Delivered'] as const) {
      await orders.detail.moveToButton(next).click();
      await toast.expectSuccess(`SO-2414 is now ${next}.`);
      await expect(orders.detail.currentStep).toHaveText(next);
    }
    await expect(orders.detail.moveTo).toHaveCount(0);
    await expect(orders.detail.root.locator('.steps .done')).toHaveText(['New', 'Confirmed', 'Picking', 'Shipped']);
    await orders.detail.close.click();
    await expect(orders.grid.cell('SO-2414', 'status')).toHaveText('Delivered');

    // shipping took the order's stock out: ASM-6100 11 - 10, BRK-1044 310 - 250
    await shell.goTo('Stock');
    await expect(stock.grid.cell('ASM-6100', 'stock')).toHaveText('1');
    await expect(stock.grid.cell('BRK-1044', 'stock')).toHaveText('60');
  });

  for (const [orderNo, status] of [['SO-2417', 'Confirmed'], ['SO-2418', 'Picking']] as const) {
    test(`a ${status} order can be cancelled and its stock is not touched`, async ({ orders, toast, shell, stock }) => {
      await orders.open(orderNo);
      await orders.detail.cancelOrder.click();
      await toast.expectSuccess(`${orderNo} was cancelled.`);
      await expect(orders.detail.cancelOrder).toHaveCount(0);
      await orders.detail.close.click();
      await expect(orders.grid.cell(orderNo, 'status')).toHaveText('Cancelled');

      await shell.goTo('Stock');
      await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('1,240');
      await expect(stock.grid.cell('GSK-3100', 'stock')).toHaveText('5,200');
    });
  }

  test('Escape closes the order details', async ({ page, orders }) => {
    await orders.open('SO-2418');
    await page.keyboard.press('Escape');
    await expect(orders.detail.root).toBeHidden();
  });

  test('a new order appears under the New filter', async ({ orders, toast }) => {
    await orders.filter('New');
    await expect(orders.grid.rows).toHaveCount(1);

    await orders.newOrder.click();
    await orders.form.fill('Filter Test Ltd', '2026-12-01', [{ sku: 'FST-2001', qty: 5 }]);
    await orders.form.submit.click();
    await toast.expectSuccess('SO-2419 created.');

    await expect(orders.grid.rows).toHaveCount(2);
    await expect(orders.grid.cell('SO-2419', 'total')).toHaveText('$55.00');
  });

  test('order lines can be added and removed', async ({ orders }) => {
    await orders.newOrder.click();
    const remove = orders.form.root.getByRole('button', { name: 'Remove line' });

    await expect(remove).toHaveCount(1);
    await expect(remove.first()).toBeDisabled(); // an order always keeps one line

    await orders.form.addLine.click();
    await orders.form.addLine.click();
    await expect(remove).toHaveCount(3);
    await expect(remove.first()).toBeEnabled();

    await remove.nth(1).click();
    await expect(remove).toHaveCount(2);
  });

  test('an order with a quantity of 0 is not created', async ({ orders }) => {
    await orders.newOrder.click();
    await orders.form.fill('Zero Qty Co', '2026-12-01', [{ sku: 'BRK-1020', qty: 0 }]);
    await orders.form.submit.click();

    await expect(orders.form.root).toBeVisible();
    await orders.form.root.getByRole('button', { name: 'Cancel' }).click();
    await expect(orders.grid.row('SO-2419')).toHaveCount(0);
  });

  test('an order without a product is not created', async ({ orders }) => {
    await orders.newOrder.click();
    await orders.form.customer.fill('No Product Co');
    await orders.form.due.fill('2026-12-01');
    await orders.form.submit.click();

    await expect(orders.form.root).toBeVisible();
  });

  test('the due date can be picked from the calendar', async ({ page, orders, toast }) => {
    await page.clock.install({ time: new Date('2026-11-06T09:00:00') });
    await orders.goto();
    await orders.newOrder.click();
    await orders.form.customer.fill('Calendar Co');
    await orders.form.root.getByRole('button', { name: 'Open calendar' }).click();
    await page.locator('ngb-datepicker [aria-label="Friday, November 20, 2026"]').click();
    await expect(orders.form.due).toHaveValue('2026-11-20');

    await orders.form.product(0).selectOption('BRK-1020');
    await orders.form.submit.click();
    await toast.expectSuccess('SO-2419 created.');
    await expect(orders.grid.cell('SO-2419', 'due')).toHaveText('2026-11-20');
  });
});
