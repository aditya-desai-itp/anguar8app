import { expect, test } from '../fixtures/test';

test.describe('dashboard', { tag: '@dashboard' }, () => {
  test.beforeEach(async ({ page, dashboard }) => {
    // "Due within 7 days" depends on today's date, so the browser clock is set to a fixed day.
    // Timers keep running, so the app's async calls still complete.
    await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
    await dashboard.goto();
  });

  test('shows the KPIs calculated from the seed data', { tag: '@smoke' }, async ({ dashboard }) => {
    await expect(dashboard.kpi('Inventory value (at cost)')).toHaveText('$18,510');
    await expect(dashboard.kpi('Open orders')).toHaveText('3');
    await expect(dashboard.kpi('Items at or below reorder')).toHaveText('3');
    // open orders due on or before 2026-11-04: SO-2417 and SO-2418 (SO-2414 is due 11-06)
    await expect(dashboard.kpi('Open orders due within 7 days')).toHaveText('2');
  });

  test('lists the items that need reordering', async ({ dashboard }) => {
    await expect(dashboard.reorderAlerts).toHaveCount(3);
    await expect(dashboard.reorderAlerts.nth(0)).toContainText('BRK-1044');
    await expect(dashboard.reorderAlerts.nth(1)).toContainText('FST-2015');
    await expect(dashboard.reorderAlerts.nth(2)).toContainText('PNL-4025');
  });

  test('shows the five most recent stock movements', async ({ dashboard }) => {
    await expect(dashboard.movements).toHaveCount(5);
    // newest = highest id; GSK-3120 is the last movement inserted by seed.sql
    await expect(dashboard.movements.first()).toContainText('GSK-3120');
    await expect(dashboard.movements.last()).toContainText('PNL-4025');
  });

  test('clicking a reorder alert opens the product', async ({ dashboard }) => {
    await dashboard.reorderAlerts.filter({ hasText: 'PNL-4025' }).click();

    const modal = dashboard.productModal;
    await expect(modal.title).toHaveText('Aluminium panel 600 x 400');
    await expect(modal.statusPill).toHaveText('Out of stock');
    await expect(modal.value('On hand')).toHaveText('0 pcs');

    await modal.close.click();
    await expect(modal.root).toBeHidden();
  });

  test('restocking from a reorder alert updates the dashboard', async ({ dashboard, toast }) => {
    await dashboard.reorderAlerts.filter({ hasText: 'BRK-1044' }).click();
    await dashboard.productModal.adjust(200, 'Delivery');
    await toast.expectSuccess('BRK-1044 now has 510 on hand.');

    await expect(dashboard.reorderAlerts).toHaveCount(2);
    await expect(dashboard.kpi('Items at or below reorder')).toHaveText('2');
    await expect(dashboard.movements.first()).toContainText('BRK-1044');
    // inventory value goes up by 200 x $2.90 = $580
    await expect(dashboard.kpi('Inventory value (at cost)')).toHaveText('$19,090');
  });

  test('order changes are reflected in the open order counts', async ({ shell, orders, dashboard, toast }) => {
    await shell.goTo('Orders');
    await orders.open('SO-2418');
    await orders.detail.moveToButton('Shipped').click();
    await toast.expectSuccess('SO-2418 is now Shipped.');
    await orders.detail.close.click();

    await shell.goTo('Dashboard');
    await expect(dashboard.kpi('Open orders')).toHaveText('2');
    await expect(dashboard.kpi('Open orders due within 7 days')).toHaveText('1');
  });
});
