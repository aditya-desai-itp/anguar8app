import { Locator, Page, expect } from '@playwright/test';

export type NavLabel = 'Dashboard' | 'Products' | 'Stock' | 'Orders';

/** Every sidebar entry: where it goes and the page heading it shows. */
export const NAV_PAGES: { label: NavLabel; path: string; heading: string | RegExp }[] = [
  { label: 'Dashboard', path: '/dashboard', heading: /^Welcome back, / },
  { label: 'Products', path: '/products', heading: 'Products' },
  { label: 'Stock', path: '/stock', heading: 'Stock levels' },
  { label: 'Orders', path: '/orders', heading: 'Customer orders' }
];

/** Side navigation shown on every signed-in page. */
export class Shell {
  readonly nav: Locator;
  readonly who: Locator;
  readonly signOut: Locator;
  readonly resetDemo: Locator;
  readonly heading: Locator;

  constructor(private page: Page) {
    this.nav = page.getByRole('navigation', { name: 'Main' });
    this.who = this.nav.locator('.who span');
    this.signOut = this.nav.getByRole('button', { name: 'Sign out' });
    this.resetDemo = this.nav.getByRole('button', { name: 'Reset demo data' });
    this.heading = page.getByRole('heading', { level: 1 });
  }

  link(label: NavLabel): Locator {
    return this.nav.getByRole('link', { name: label, exact: true });
  }

  /** Clicks a sidebar link and waits until that page has opened (pages are lazy loaded). */
  async goTo(label: NavLabel): Promise<void> {
    const target = NAV_PAGES.find(p => p.label === label)!;
    await this.link(label).click();
    await expect(this.page).toHaveURL(new RegExp(target.path + '$'));
    await expect(this.heading).toHaveText(target.heading);
  }
}
