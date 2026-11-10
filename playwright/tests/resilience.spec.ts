import { CREDENTIALS, expect, test } from '../fixtures/test';

/**
 * Some browsers (private modes, locked-down company policies) throw when a page touches localStorage or
 * sessionStorage. The app catches this: it keeps working, it just can't remember data or the session.
 */
function blockStorage(name: 'localStorage' | 'sessionStorage'): string {
  return `Object.defineProperty(window, '${name}', {
    configurable: true,
    get() { throw new DOMException('${name} is blocked', 'SecurityError'); }
  });`;
}

test.describe('when localStorage is blocked', { tag: '@resilience' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ content: blockStorage('localStorage') });
  });

  test('the app still loads the sample data and accepts changes', async ({ stock, toast }) => {
    await stock.goto();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('42');

    await stock.grid.open('FST-2015');
    await stock.detail.adjust(8, 'Count');
    await toast.expectSuccess('FST-2015 now has 50 on hand.');
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('50');
  });

  test('changes are not kept after a reload, and reset still works', async ({ page, stock, shell, toast }) => {
    await stock.goto();
    await stock.grid.open('FST-2015');
    await stock.detail.adjust(8, 'Count');
    await toast.expectSuccess('FST-2015 now has 50 on hand.');

    await page.reload();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('42');

    await shell.resetDemo.click();
    await expect(stock.grid.cell('FST-2015', 'stock')).toHaveText('42');
  });
});

test.describe('when the saved database is corrupted', { tag: '@resilience' }, () => {
  // the app's GlobalErrorHandler logs the error to the console (allowed here)
  test.use({ allowedBrowserErrors: [/file is not a database|ERROR Error|Error:/] });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__pw_corrupted')) {
        sessionStorage.setItem('__pw_corrupted', '1');
        localStorage.setItem('forge-inventory-db-v1', btoa('this is not a SQLite database '.repeat(50)));
      }
    });
  });

  // KNOWN BUG (found by this suite): GlobalErrorHandler logs the error and calls ToastService.error(), but
  // the message is never drawn, and the dashboard stays on "Loading…". The test checks the intended
  // behaviour and is marked as an expected failure; once the app is fixed Playwright reports it as
  // "unexpectedly passed" and the test.fail line should be removed.
  test.fail(
    'the user sees a "something went wrong" message',
    { annotation: { type: 'known bug', description: 'The global error message is not displayed; the dashboard stays on "Loading…"' } },
    async ({ page, toast }) => {
      await page.goto('/dashboard');
      await toast.expectError('Something went wrong. Please try again.');
    }
  );

  test('"Reset demo data" recovers the app', async ({ page, shell, dashboard }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Loading…')).toBeVisible();

    // throws the broken copy away and reloads the sample data
    await shell.resetDemo.click();
    await expect(dashboard.kpi('Open orders')).toHaveText('3');
  });
});

test.describe('when sessionStorage is blocked', { tag: '@resilience' }, () => {
  test.use({ role: null });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ content: blockStorage('sessionStorage') });
  });

  test('users can sign in and out, but a reload asks to sign in again', async ({ page, loginPage, shell, dashboard }) => {
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.manager.username, CREDENTIALS.manager.password);
    await expect(dashboard.heading).toHaveText('Welcome back, Planner');

    await page.reload();
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard$/);

    await loginPage.login(CREDENTIALS.viewer.username, CREDENTIALS.viewer.password);
    await expect(shell.who).toHaveText('Viewer · Viewer');
    await shell.signOut.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
