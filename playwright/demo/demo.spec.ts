import { CREDENTIALS, expect, test } from '../fixtures/test';
import { caption, card } from './caption';

/**
 * The demo video: one end-to-end walkthrough of the main journeys, slowed down and captioned.
 * Every step still makes real assertions, so if the app misbehaves the recording stops with a failure.
 * Run with `npm run demo` (records headless; no browser window opens).
 */
test.use({ role: null });

const TOTAL = process.env.DEMO_TEST_COUNT || 'the full';

test('Forge Inventory: automated end-to-end walkthrough', async ({
  page, loginPage, shell, toast, dashboard, products, stock, orders
}) => {
  await page.goto('/login');
  await card(page, 'Forge Inventory · automated E2E tests', [
    'Playwright drives a real browser through the app and checks every result.',
    'Each caption below is a check that has just passed.'
  ]);

  await test.step('1 · Sign in', async () => {
    await caption(page, 'Step 1 · Sign in', 'Signing in, first with a wrong password…', 1200);
    await loginPage.login('planner', 'wrong-password');
    await expect(loginPage.error).toHaveText('Username or password is incorrect.');
    await caption(page, 'Step 1 · Sign in', '✓ A wrong password is refused');

    await loginPage.login(CREDENTIALS.manager.username, CREDENTIALS.manager.password);
    await expect(dashboard.heading).toHaveText('Welcome back, Planner');
    await caption(page, 'Step 1 · Sign in', '✓ The manager signs in and lands on the dashboard');
  });

  await test.step('2 · Dashboard', async () => {
    await caption(page, 'Step 2 · Dashboard', 'Checking the dashboard figures…', 1200);
    await expect(dashboard.kpi('Inventory value (at cost)')).toHaveText('$18,510');
    await expect(dashboard.kpi('Open orders')).toHaveText('3');
    await expect(dashboard.reorderAlerts).toHaveCount(3);
    await caption(page, 'Step 2 · Dashboard', '✓ Inventory value $18,510, 3 open orders, 3 items to reorder');
  });

  await test.step('3 · Products', async () => {
    await caption(page, 'Step 3 · Products', 'Searching and adding products…', 1200);
    await shell.goTo('Products');
    await products.search.fill('gasket');
    await expect(products.grid.rows).toHaveCount(2);
    await caption(page, 'Step 3 · Products', '✓ Search finds the two gaskets');
    await products.search.fill('');

    await products.newProduct.click();
    await products.form.fill({
      sku: 'tst-12', name: 'Demo spring 20 mm', category: 'Springs', cost: 0.5, price: 1.25,
      stock: 50, minLevel: 10, maxLevel: 200, bin: 'F-01-1', supplier: 'Demo Supplies'
    });
    await products.form.submit.click();
    await expect(products.form.feedback('SKU')).toHaveText('Use the format ABC-1234.');
    await caption(page, 'Step 3 · Products', '✓ An invalid SKU is rejected with a clear message');

    await products.form.field('SKU').fill('TST-9001');
    await products.form.submit.click();
    await toast.expectSuccess('TST-9001 added.');
    await caption(page, 'Step 3 · Products', '✓ A valid product is added');

    await products.newProduct.click();
    await products.form.fill({
      sku: 'BRK-1020', name: 'Duplicate', category: 'Brackets', cost: 1, price: 2, bin: 'A-00-0', supplier: 'X'
    });
    await products.form.submit.click();
    await toast.expectError('SKU BRK-1020 already exists.');
    await caption(page, 'Step 3 · Products', '✓ A duplicate SKU is refused');
    await products.form.cancel.click();
  });

  await test.step('4 · Stock', async () => {
    await caption(page, 'Step 4 · Stock', 'Filtering and adjusting stock…', 1200);
    await shell.goTo('Stock');
    await stock.toggleOnlyLow();
    await expect(stock.grid.rows).toHaveCount(3);
    await caption(page, 'Step 4 · Stock', '✓ "Only below reorder level" shows the 3 low items');
    await stock.toggleOnlyLow();

    await stock.grid.open('BRK-1044');
    await stock.detail.adjust(200, 'Delivery');
    await toast.expectSuccess('BRK-1044 now has 510 on hand.');
    await expect(stock.grid.cell('BRK-1044', 'status')).toHaveText('In stock');
    await caption(page, 'Step 4 · Stock', '✓ Receiving 200 units moves BRK-1044 from Low to In stock');

    await stock.grid.open('FST-2015');
    await stock.detail.adjust(-9999, 'Too many');
    await toast.expectError('Not enough stock of FST-2015: 42 on hand.');
    await caption(page, 'Step 4 · Stock', '✓ Stock can never go below zero');
    await stock.detail.close.click();
  });

  await test.step('5 · Orders', async () => {
    await caption(page, 'Step 5 · Orders', 'Creating an order and moving orders along…', 1200);
    await shell.goTo('Orders');
    await orders.newOrder.click();
    await orders.form.fill('Acme Test Co', '2026-12-15', [
      { sku: 'BRK-1020', qty: 10 },
      { sku: 'GSK-3100', qty: 100 }
    ]);
    await orders.form.submit.click();
    await toast.expectSuccess('SO-2419 created.');
    await expect(orders.grid.cell('SO-2419', 'total')).toHaveText('$315.00');
    await caption(page, 'Step 5 · Orders', '✓ A two-line order is created: SO-2419, $315.00');

    await orders.open('SO-2418');
    await orders.detail.moveToButton('Shipped').click();
    await toast.expectSuccess('SO-2418 is now Shipped.');
    await caption(page, 'Step 5 · Orders', '✓ SO-2418 moves from Picking to Shipped');
    await orders.detail.close.click();

    await shell.goTo('Stock');
    await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('840');
    await caption(page, 'Step 5 · Orders', '✓ Shipping took 400 × BRK-1020 out of stock (1,240 → 840)');

    await shell.goTo('Orders');
    await orders.open('SO-2417');
    await orders.detail.moveToButton('Picking').click();
    await toast.expectSuccess('SO-2417 is now Picking.');
    await orders.detail.moveToButton('Shipped').click();
    await toast.expectError('Not enough stock of PNL-4025: 0 on hand.');
    await caption(page, 'Step 5 · Orders', '✓ An order can’t ship while a product is out of stock');
    await orders.detail.close.click();
  });

  await test.step('6 · Navigation', async () => {
    await caption(page, 'Step 6 · Navigation', 'Opening every page from the sidebar…', 1200);
    for (const label of ['Dashboard', 'Products', 'Stock', 'Orders'] as const) {
      await shell.goTo(label);
      await expect(shell.link(label)).toHaveClass(/active/);
    }
    await caption(page, 'Step 6 · Navigation', '✓ Every page opens from the sidebar');
  });

  await test.step('7 · Viewer (read-only)', async () => {
    await caption(page, 'Step 7 · Viewer', 'Signing in as a read-only viewer…', 1200);
    await shell.signOut.click();
    await loginPage.login(CREDENTIALS.viewer.username, CREDENTIALS.viewer.password);
    await expect(shell.who).toHaveText('Viewer · Viewer');
    await caption(page, 'Step 7 · Viewer', '✓ A read-only viewer signs in');

    await shell.goTo('Products');
    await expect(products.newProduct).toBeDisabled();
    await products.grid.open('BRK-1020');
    await expect(products.detail.apply).toBeDisabled();
    await caption(page, 'Step 7 · Viewer', '✓ Viewers can look, but can’t add products or adjust stock');
    await products.detail.close.click();

    await shell.goTo('Orders');
    await expect(orders.newOrder).toBeDisabled();
    await orders.open('SO-2414');
    await expect(orders.detail.moveTo).toHaveCount(0);
    await expect(orders.detail.cancelOrder).toHaveCount(0);
    await caption(page, 'Step 7 · Viewer', '✓ …and can’t create, move or cancel orders');
    await orders.detail.close.click();
  });

  await test.step('8 · Reset', async () => {
    await caption(page, 'Step 8 · Reset', 'Restoring the sample data…', 1200);
    await shell.goTo('Stock');
    await shell.resetDemo.click();
    await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('1,240');
    await caption(page, 'Step 8 · Reset', '✓ "Reset demo data" restores the original sample data');
  });

  await card(page, 'All checks passed ✓', [
    'This walkthrough covered sign-in, dashboard, products, stock, orders, navigation and viewer access.',
    `${TOTAL} automated tests run on every push in GitHub Actions, with code coverage measured.`
  ], 5000);
});
