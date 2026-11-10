import { CREDENTIALS, expect, test } from '../fixtures/test';

test.describe('signing in', { tag: '@auth' }, () => {
  test.use({ role: null });

  test('manager signs in and lands on the dashboard', { tag: '@smoke' }, async ({ page, loginPage, shell, dashboard }) => {
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.manager.username, CREDENTIALS.manager.password);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard.heading).toHaveText('Welcome back, Planner');
    await expect(shell.who).toHaveText('Planner · Manager');
  });

  test('viewer signs in with the read-only role', async ({ page, loginPage, shell }) => {
    await loginPage.goto();
    await loginPage.login(CREDENTIALS.viewer.username, CREDENTIALS.viewer.password);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(shell.who).toHaveText('Viewer · Viewer');
  });

  test('wrong password shows an error and stays on the login page', { tag: '@smoke' }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('planner', 'wrong-password');

    await expect(loginPage.error).toHaveText('Username or password is incorrect.');
    await expect(page).toHaveURL(/\/login$/);
  });

  for (const [what, username, password] of [
    ['unknown user', 'nobody', 'factory123'],
    ['password in the wrong case', 'planner', 'FACTORY123'],
    ["another user's password", 'viewer', 'factory123']
  ]) {
    test(`${what} is refused`, async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login(username, password);
      await expect(loginPage.error).toHaveText('Username or password is incorrect.');
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('spaces around the username are ignored', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('  planner  ', 'factory123');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('the error clears after a correct sign in attempt', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('planner', 'nope');
    await expect(loginPage.error).toBeVisible();
    await loginPage.login('planner', 'factory123');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  for (const field of ['username', 'password'] as const) {
    test(`sign in button is disabled while the ${field} is empty`, async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.submit).toBeEnabled(); // the form starts prefilled
      await loginPage[field].fill('');
      await expect(loginPage.submit).toBeDisabled();
    });
  }

  test('Enter in the password field signs in', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.username.fill('viewer');
    await loginPage.password.fill('viewer123');
    await loginPage.password.press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('a protected page redirects to login and returns there after signing in', async ({ page, loginPage, orders }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Forders$/);

    await loginPage.login(CREDENTIALS.manager.username, CREDENTIALS.manager.password);
    await expect(page).toHaveURL(/\/orders$/);
    await expect(orders.heading).toBeVisible();
  });
});

test.describe('signing out', { tag: '@auth' }, () => {
  test('sign out returns to login and the app stays locked', { tag: '@smoke' }, async ({ page, dashboard, shell }) => {
    await dashboard.goto();
    await expect(dashboard.heading).toHaveText('Welcome back, Planner');

    await shell.signOut.click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard$/);
  });

  test('after signing out, another user can sign in', async ({ page, dashboard, shell, loginPage }) => {
    await dashboard.goto();
    await shell.signOut.click();
    await loginPage.login('viewer', 'viewer123');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(shell.who).toHaveText('Viewer · Viewer');
  });
});
