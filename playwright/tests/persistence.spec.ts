import { expect, test } from '../fixtures/test';

test.describe('saved data', { tag: '@persistence' }, () => {
  test('changes survive a reload and "Reset demo data" restores the seed', { tag: '@smoke' }, async ({ page, stock, shell, toast }) => {
    await stock.goto();
    await stock.grid.open('FST-2015');
    await stock.detail.adjust(100, 'Delivery');
    await toast.expectSuccess('FST-2015 now has 142 on hand.');

    // the database is saved to localStorage after every write
    await page.reload();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('142');

    await shell.resetDemo.click();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('42');
  });

  test('"Reset demo data" deletes the saved database before reloading', async ({ page, stock, shell, toast }) => {
    await stock.goto();
    await stock.grid.open('FST-2015');
    await stock.detail.adjust(100, 'Delivery');
    await toast.expectSuccess('FST-2015 now has 142 on hand.');
    expect(await page.evaluate(() => localStorage.getItem('forge-inventory-db-v1'))).not.toBeNull();

    // Stop the reload that follows the reset, so we can look at storage in between.
    // (This also keeps the code-coverage record of the reset, which a reload would throw away.)
    await page.evaluate(() =>
      window.addEventListener('beforeunload', e => {
        e.preventDefault();
        e.returnValue = '';
      })
    );
    page.once('dialog', dialog => dialog.dismiss());
    await shell.resetDemo.click();

    await expect.poll(() => page.evaluate(() => localStorage.getItem('forge-inventory-db-v1'))).toBeNull();
  });
});
