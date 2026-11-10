import { expect, test } from '../fixtures/test';

test.describe('stock', { tag: '@stock' }, () => {
  test.beforeEach(async ({ stock }) => {
    await stock.goto();
  });

  test('lists the ten products eight per page', async ({ stock }) => {
    await expect(stock.grid.rows).toHaveCount(8);
    await stock.grid.nextPage();
    await expect(stock.grid.rows).toHaveCount(2);
  });

  test('"only below reorder level" shows just the low items', async ({ stock }) => {
    await stock.toggleOnlyLow();
    await expect(stock.grid.rows).toHaveCount(3);
    expect(await stock.grid.columnValues('sku')).toEqual(['BRK-1044', 'FST-2015', 'PNL-4025']);

    await stock.toggleOnlyLow();
    await expect(stock.grid.rows).toHaveCount(8);
  });

  test('receiving stock clears the low status', { tag: '@smoke' }, async ({ stock, toast }) => {
    await expect(stock.grid.cell('BRK-1044', 'status')).toHaveText('Low');

    await stock.grid.open('BRK-1044');
    await stock.detail.adjust(200, 'Cycle count');

    await toast.expectSuccess('BRK-1044 now has 510 on hand.');
    await expect(stock.grid.cell('BRK-1044', 'stock')).toHaveText('510');
    await expect(stock.grid.cell('BRK-1044', 'status')).toHaveText('In stock');

    const latest = stock.movements.first();
    await expect(latest).toContainText('BRK-1044');
    await expect(latest).toContainText('Adjust');
    await expect(latest).toContainText('Cycle count');
    await expect(latest).toContainText('+200');
  });

  test('items on the second page can be opened', async ({ stock }) => {
    await stock.grid.nextPage();
    await stock.grid.open('PNL-4025');
    await expect(stock.detail.title).toHaveText('Aluminium panel 600 x 400');
    await expect(stock.detail.statusPill).toHaveText('Out of stock');
  });

  test('stock cannot go below zero', { tag: '@smoke' }, async ({ stock, toast }) => {
    await stock.grid.open('FST-2015');
    await stock.detail.adjust(-9999);

    await toast.expectError('Not enough stock of FST-2015: 42 on hand.');
    await expect(stock.detail.root).toBeVisible();
    await stock.detail.close.click();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('42');
  });

  test('taking out all remaining stock marks the item Out', async ({ stock, toast }) => {
    await stock.grid.open('GSK-3120');
    await stock.detail.adjust(-880, 'Scrapped');

    await toast.expectSuccess('GSK-3120 now has 0 on hand.');
    await expect(stock.grid.cell('GSK-3120', 'stock')).toHaveText('0');
    await expect(stock.grid.cell('GSK-3120', 'status')).toHaveText('Out');
    await expect(stock.movements.first()).toContainText('-880');
  });

  test('taking stock below the reorder level marks the item Low', async ({ stock, toast }) => {
    await stock.grid.open('GSK-3100'); // 5,200 on hand, reorder at 1,500
    await stock.detail.adjust(-4000);
    await toast.expectSuccess('GSK-3100 now has 1200 on hand.');
    await expect(stock.grid.cell('GSK-3100', 'status')).toHaveText('Low');
  });

  test('apply is disabled for a decimal quantity', async ({ stock }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.qty.fill('1.5');
    await expect(stock.detail.apply).toBeDisabled();
    await stock.detail.qty.fill('2');
    await expect(stock.detail.apply).toBeEnabled();
  });

  test('Escape closes the details without changing stock', async ({ page, stock }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.qty.fill('100');
    await page.keyboard.press('Escape');
    await expect(stock.detail.root).toBeHidden();
    await expect(stock.grid.cell('BRK-1020', 'stock')).toHaveText('1,240');
  });

  test('the grid works from the keyboard: Enter opens a row, arrows move', async ({ page, stock }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.close.click();
    await expect(stock.detail.root).toBeHidden();

    // the clicked cell keeps keyboard focus, so Enter opens it again
    await page.keyboard.press('Enter');
    await expect(stock.detail.title).toHaveText('Brake bracket, zinc');
    await stock.detail.close.click();

    // other keys don't open anything; arrow down moves to the next row, which Enter then opens
    await page.keyboard.press('ArrowDown');
    await expect(stock.detail.root).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(stock.detail.title).toHaveText('Mounting bracket, 90 deg');
  });

  test('sorting by level and by status puts the emptiest items first', async ({ stock }) => {
    await stock.grid.sortBy('level'); // on hand / max level: PNL-4025 0, FST-2015 0.168, BRK-1044 0.172
    expect((await stock.grid.columnValues('sku')).slice(0, 3)).toEqual(['PNL-4025', 'FST-2015', 'BRK-1044']);

    await stock.grid.sortBy('status'); // on hand / reorder level
    expect((await stock.grid.columnValues('sku')).slice(0, 3)).toEqual(['PNL-4025', 'BRK-1044', 'FST-2015']);
  });

  test('applying an adjustment of 0 changes nothing', async ({ stock, toast }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.adjust(0);

    await expect(stock.detail.root).toBeVisible();
    await expect(toast.root).toHaveCount(0);
    await expect(stock.movements).toHaveCount(5);
  });

  test('the confirmation message disappears by itself', async ({ stock, toast }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.adjust(1);
    await toast.expectSuccess('BRK-1020 now has 1241 on hand.');
    await expect(toast.root).toBeHidden({ timeout: 6_000 }); // the app hides it after 3 seconds
  });

  test('apply is disabled without a reason', async ({ stock }) => {
    await stock.grid.open('BRK-1020');
    await stock.detail.reason.fill('');
    await expect(stock.detail.apply).toBeDisabled();
  });
});
