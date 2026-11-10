import { expect, test } from '../fixtures/test';
import { NAV_PAGES } from '../pages/shell';

// The same navigation checks run for both roles: viewers can see every page, they just can't change data.
for (const role of ['Manager', 'Viewer'] as const) {
  test.describe(`navigation as ${role}`, { tag: '@navigation' }, () => {
    test.use({ role });

    test('the sidebar opens every page', { tag: '@smoke' }, async ({ page, dashboard, shell }) => {
      await dashboard.goto();
      await expect(shell.nav.getByRole('link')).toHaveText(NAV_PAGES.map(p => p.label));

      // Go through the pages in reverse so every click really changes the page (we start on the dashboard).
      for (const target of [...NAV_PAGES].reverse()) {
        await shell.goTo(target.label);
        await expect(page).toHaveURL(new RegExp(target.path + '$'));
        await expect(shell.heading).toHaveText(target.heading);
        await expect(shell.link(target.label)).toHaveClass(/active/);
        for (const other of NAV_PAGES.filter(p => p !== target)) {
          await expect(shell.link(other.label)).not.toHaveClass(/active/);
        }
      }
    });

    test('dashboard links open the stock page', async ({ page, dashboard, shell }) => {
      await dashboard.goto();
      await page.getByRole('link', { name: 'View stock' }).click();
      await expect(page).toHaveURL(/\/stock$/);
      await expect(shell.heading).toHaveText('Stock levels');

      await shell.goTo('Dashboard');
      await page.getByRole('link', { name: 'All movements' }).click();
      await expect(page).toHaveURL(/\/stock$/);
    });

    test('browser back and forward move between pages', async ({ page, dashboard, shell }) => {
      await dashboard.goto();
      await shell.goTo('Products');
      await shell.goTo('Orders');

      await page.goBack();
      await expect(page).toHaveURL(/\/products$/);
      await expect(shell.heading).toHaveText('Products');
      await page.goBack();
      await expect(page).toHaveURL(/\/dashboard$/);
      await page.goForward();
      await expect(page).toHaveURL(/\/products$/);
    });

    test('the root and unknown addresses go to the dashboard', async ({ page, shell }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.goto('/no-such-page');
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(shell.heading).toHaveText(/^Welcome back, /);
    });

    test('the login page sends a signed-in user to the dashboard', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('reloading keeps the user signed in on the same page', async ({ page, shell }) => {
      await page.goto('/orders');
      await page.reload();
      await expect(page).toHaveURL(/\/orders$/);
      await expect(shell.who).toContainText(role);
    });
  });
}

test.describe('navigation while signed out', { tag: '@navigation' }, () => {
  test.use({ role: null });

  for (const target of NAV_PAGES) {
    test(`${target.path} asks to sign in first and then opens`, async ({ page, loginPage, shell }) => {
      await page.goto(target.path);
      await expect(page).toHaveURL(new RegExp('/login\\?returnUrl=' + encodeURIComponent(target.path) + '$'));

      await loginPage.login('viewer', 'viewer123');
      await expect(page).toHaveURL(new RegExp(target.path + '$'));
      await expect(shell.heading).toHaveText(target.heading);
    });
  }
});
