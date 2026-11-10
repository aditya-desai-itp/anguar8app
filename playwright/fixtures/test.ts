import { test as base, expect } from '@playwright/test';
import MCR from 'monocart-coverage-reports';

import { coverageOptions } from '../coverage/options';

import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { OrdersPage } from '../pages/orders.page';
import { ProductsPage } from '../pages/products.page';
import { Shell } from '../pages/shell';
import { StockPage } from '../pages/stock.page';
import { Toast } from '../pages/toast';

export type Role = 'Manager' | 'Viewer' | null;

/** Same shape the app keeps in sessionStorage under 'forge-user' (see src/app/core/auth.service.ts). */
const USERS = {
  Manager: { username: 'planner', name: 'Planner', role: 'Manager' },
  Viewer: { username: 'viewer', name: 'Viewer', role: 'Viewer' }
};

export const CREDENTIALS = {
  manager: { username: 'planner', password: 'factory123' },
  viewer: { username: 'viewer', password: 'viewer123' }
};

type Options = {
  /** Who is signed in when the test starts. null = signed out. Override with test.use({ role: 'Viewer' }). */
  role: Role;
  /** Console errors matching these patterns don't fail the test (for tests that provoke an error on purpose). */
  allowedBrowserErrors: RegExp[];
};

type Fixtures = {
  failOnBrowserErrors: void;
  collectCoverage: void;
  loginPage: LoginPage;
  shell: Shell;
  toast: Toast;
  dashboard: DashboardPage;
  products: ProductsPage;
  stock: StockPage;
  orders: OrdersPage;
};

/**
 * Every test gets a new browser context, so localStorage is empty and the app loads its seed data
 * (src/assets/seed.sql). Tests can change data freely without affecting each other.
 */
export const test = base.extend<Options & Fixtures>({
  role: ['Manager', { option: true }],
  allowedBrowserErrors: [[], { option: true }],

  // Signing in through the form in every test is slow, so the session is written straight into sessionStorage.
  // storageState can't be used because it does not keep sessionStorage.
  // The marker key means this happens once per tab, so "Sign out" followed by a reload stays signed out.
  page: async ({ page, role }, use) => {
    if (role) {
      await page.addInitScript(user => {
        if (!sessionStorage.getItem('__pw_seeded')) {
          sessionStorage.setItem('__pw_seeded', '1');
          sessionStorage.setItem('forge-user', JSON.stringify(user));
        }
      }, USERS[role]);
    }
    await use(page);
  },

  // Fails the test if the page throws or logs console.error (GlobalErrorHandler logs every unhandled error).
  failOnBrowserErrors: [
    async ({ page, allowedBrowserErrors }, use) => {
      const errors: string[] = [];
      const allowed = (text: string) => allowedBrowserErrors.some(re => re.test(text));
      page.on('pageerror', e => {
        if (!allowed(e.message)) {
          errors.push('pageerror: ' + e.message);
        }
      });
      page.on('console', m => {
        if (m.type() === 'error' && !allowed(m.text())) {
          errors.push('console.error: ' + m.text());
        }
      });
      await use();
      expect(errors, 'browser errors during the test').toEqual([]);
    },
    { auto: true }
  ],

  // E2E_COVERAGE=1: records which app code ran during the test (Chromium only) and adds it to the shared report.
  collectCoverage: [
    async ({ page, browserName }, use) => {
      const enabled = !!process.env.E2E_COVERAGE && browserName === 'chromium';
      if (enabled) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }
      await use();
      if (enabled) {
        const coverage = await page.coverage.stopJSCoverage();
        await MCR(coverageOptions).add(coverage);
      }
    },
    { auto: true }
  ],

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  shell: async ({ page }, use) => use(new Shell(page)),
  toast: async ({ page }, use) => use(new Toast(page)),
  dashboard: async ({ page }, use) => use(new DashboardPage(page)),
  products: async ({ page }, use) => use(new ProductsPage(page)),
  stock: async ({ page }, use) => use(new StockPage(page)),
  orders: async ({ page }, use) => use(new OrdersPage(page))
});

export { expect };
