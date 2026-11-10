import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const COVERAGE = !!process.env.E2E_COVERAGE;
const DEMO = !!process.env.DEMO;

/**
 * Which build of the app the tests run against:
 * - normal runs: the production build (`npx ng build --prod` at the repo root, Node 12)
 * - E2E_COVERAGE=1: a development build with source maps (`npx ng build --output-path dist/forge-inventory-cov`),
 *   on its own port so an `ng serve` on 4200 is never mistaken for it
 * Locally, a server already running on the port (for example `npm start`) is reused.
 */
const DIST = COVERAGE ? '../dist/forge-inventory-cov' : '../dist/forge-inventory';
const PORT = Number(process.env.E2E_PORT || (COVERAGE ? 4310 : 4200));

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // coverage runs serve an unminified build and record coverage, so fewer browsers at once keeps them stable
  workers: isCI ? 2 : COVERAGE ? 4 : undefined,
  // a demo run only prints to the terminal, so it doesn't replace the HTML report of the last full run
  reporter: DEMO
    ? [['list']]
    : isCI
      ? [['github'], ['html', { open: 'never' }], ['list']]
      : [['html', { open: 'never' }], ['list']],
  outputDir: DEMO ? './test-results-demo' : './test-results',
  // 60 s per test: against `ng serve` (unoptimised dev build) the first page load in each worker can be slow
  timeout: 60_000,
  expect: { timeout: 7_000 },
  globalSetup: COVERAGE ? './coverage/setup.ts' : undefined,
  globalTeardown: COVERAGE ? './coverage/teardown.ts' : undefined,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // no browser windows; use `npm run test:headed` or `npm run test:ui` to watch a run
    headless: true,
    // SLOWMO=<milliseconds> pauses before every click/fill/select so a headed run can be followed by eye
    launchOptions: { slowMo: Number(process.env.SLOWMO || 0) },
    // a trace (every step, DOM snapshot, network call and console line) for every test, passed or failed;
    // open it from the HTML report (npm run report) or with `npx playwright show-trace <trace.zip>`
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    // -s = single page app: unknown paths such as /products fall back to index.html
    command: `npx serve -s ${DIST} -l ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 60_000
  },
  projects: DEMO
    ? [
        // `npm run demo`: one captioned walkthrough, recorded to video at a watchable speed (still headless)
        {
          name: 'demo',
          testDir: './demo',
          timeout: 15 * 60_000,
          use: {
            ...devices['Desktop Chrome'],
            viewport: { width: 1280, height: 720 },
            video: { mode: 'on', size: { width: 1280, height: 720 } },
            launchOptions: { slowMo: Number(process.env.SLOWMO || 350) }
          }
        }
      ]
    : [
        // Chromium only. PW_CHANNEL=msedge uses the installed Microsoft Edge instead of Playwright's Chromium.
        {
          name: 'chromium',
          testDir: './tests',
          use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined }
        },
        // ALL_BROWSERS=1 adds Firefox and WebKit (install them first: npx playwright install firefox webkit)
        ...(process.env.ALL_BROWSERS && !COVERAGE
          ? [
              { name: 'firefox', testDir: './tests', use: { ...devices['Desktop Firefox'] } },
              { name: 'webkit', testDir: './tests', use: { ...devices['Desktop Safari'] } }
            ]
          : [])
      ]
});
