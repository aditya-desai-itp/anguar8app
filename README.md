# Forge Inventory

Angular 8 app for a small factory: products, stock levels and customer orders.
UI is Bootstrap 4 with ng-bootstrap (modals, date picker, toast) and ag-Grid Community 22 for the data grids.
Runs entirely in the browser. Data lives in SQLite (sql.js) behind a service layer, saved to `localStorage`.

## Run it

Angular 8 needs Node 12.

```bash
nvm use            # reads .nvmrc (12.22.12)
npm install
npm start          # http://localhost:4200
npm test           # Karma + Jasmine (set CHROME_BIN; use --browsers=ChromeHeadlessCI for headless)
npm run lint
ng build --prod
```

Demo logins: `planner` / `factory123` (Manager) and `viewer` / `viewer123` (read only).
"Reset demo data" in the side bar restores the seed data from `src/assets/seed.sql`.

## End-to-end tests (Playwright)

The Playwright suite is in [`playwright/`](playwright/), which has its own `package.json`.
It runs in **headless Chromium** against the **built** app, not `ng serve`.
The app needs Node 12 to build, and Playwright needs Node 18 or newer, so use two Command Prompt windows.

```bat
:: Window A: Node 12 (portable zip from nodejs.org, extracted to C:\tools\node12; this window only)
set "PATH=C:\tools\node12\node-v12.22.12-win-x64;%PATH%"
npm ci
npx ng build --prod

:: Window B: your normal Node 20+
cd playwright
npm ci
npx playwright install chromium
npx playwright test
```

| What | Command (in `playwright/`) |
|---|---|
| Whole suite | `npx playwright test` |
| Smoke set only | `npx playwright test --grep @smoke` |
| One area | `npx playwright test --grep @orders` |
| HTML report (a trace for every test) | `npm run report` |
| Watch in Edge, slowed down | `set PW_CHANNEL=msedge` then `set SLOWMO=500` then `npm run test:headed` |
| Step through interactively | `npm run test:ui` |
| Code coverage | build `dist/forge-inventory-cov` with Node 12 (`npx ng build --output-path dist/forge-inventory-cov`), then `scripts\coverage.cmd` → `coverage-report/index.html` |
| Test count and inventory | `npm run inventory` → `docs/TEST-INVENTORY.md` |
| Recorded, captioned demo video | `npm run demo` → `demo-video/forge-inventory-demo.webm` |

- **Other options:** `E2E_PORT` picks another port; a server already running on that port (for example `npm start`) is used instead of the built files. `ALL_BROWSERS=1` adds Firefox and WebKit.
- **Documentation:** [docs/COVERAGE-MATRIX.md](playwright/docs/COVERAGE-MATRIX.md) maps every feature and rule to its tests. [docs/DEMO-SCRIPT.md](playwright/docs/DEMO-SCRIPT.md) is a script for a recorded demo.
- **CI:** `.github/workflows/e2e.yml` runs the suite and a code-coverage job on every push and pull request to `main`. It uploads the HTML report, the inventory and the coverage report.

## Layout

```
src/app/
  core/       DbService (sql.js), AuthService, AuthGuard, ToastService, GlobalErrorHandler
  models/     interfaces and small pure helpers
  services/   ProductService, StockService, OrderService (return Observables)
  shared/     GridComponent (ag-Grid wrapper), ProductDetailComponent (NgbModal content), ToastComponent
  features/   auth, shell (nav), dashboard, products, stock, orders (each lazy loaded, except auth and shell)
```

## Notes

- ag-Grid is pinned to 22.1 and ng-bootstrap to 5.3 because later majors need Angular 9+. The `ag-theme-bootstrap` theme logs a deprecation warning in the console; it is removed in ag-Grid 23.
- ag-Grid raises row events outside Angular's zone. `GridComponent` re-enters the zone before emitting, otherwise modals opened from a row click are not change-detected.
- Modal content components are opened with `NgbModal` and listed in `entryComponents` (required in Angular 8).
- Components never touch SQLite. Only the three domain services call `DbService`, so a REST backend can replace it later.
- Write rules live in the services (`requireManager`, stock cannot go below zero, shipping an order takes stock out), not only in the UI.
- Shipping an order, cancelling and adjusting stock run in SQLite transactions.
- Passwords in `seed.sql` are plain text because this is mock data. Do not reuse this pattern with a real backend.
