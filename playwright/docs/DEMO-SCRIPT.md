# Demo recording script (about 6–8 minutes)

This is a script for recording your screen while you show the Playwright suite.
The automated walkthrough video (`demo-video/forge-inventory-demo.webm`) is shown at the end, or can be sent on its own.

**Recording tool:** Clipchamp (Start menu → Clipchamp → Record → Screen) or Xbox Game Bar (`Win + Alt + R` to start and stop).
Close other windows, make Command Prompt and VS Code text large (`Ctrl` + `+`), and turn off notifications.

## Before you start recording

Open **two Command Prompt windows**.

Window A, **Node 12** (builds the app):
```bat
set "PATH=C:\tools\node12\node-v12.22.12-win-x64;%PATH%"
cd /d C:\Projects\Siemens-App-Mod-Project\anguar8app
npx ng build --prod
npx ng build --output-path dist/forge-inventory-cov
```

Window B, **normal Node** (runs the tests):
```bat
cd /d C:\Projects\Siemens-App-Mod-Project\anguar8app\playwright
npm run demo
```
Run `npm run demo` once beforehand, so the video already exists.

## 1. The application (about 1 minute)

Window B:
```bat
npx serve -s ..\dist\forge-inventory -l 4200
```
Open http://localhost:4200 in Edge.

> "This is Forge Inventory, an Angular 8 app for products, stock and customer orders. It has managers, who can change data, and viewers, who are read-only."

Sign in as `planner` / `factory123`, click through Dashboard, Products, Stock and Orders, then stop the server with `Ctrl+C`.

## 2. How many tests (about 1 minute)

```bat
npm run inventory
```
Open `playwright\docs\TEST-INVENTORY.md` in VS Code (`Ctrl+Shift+V` for the preview).

> "There are N automated Playwright tests across 9 areas: sign-in, navigation, dashboard, products, stock, orders, viewer permissions, saved data and resilience. 16 of them are a fast smoke set."

Open `playwright\docs\COVERAGE-MATRIX.md`:

> "This matrix lists every feature and rule of the app, and the tests that check it, for both roles."

## 3. Running the whole suite (about 2 minutes)

```bat
npx playwright test
```

> "Playwright runs every test in a real Chromium browser, several in parallel. Each test starts from clean data, so tests can't affect each other."

Wait for the result line: **"N passed"**, plus 1 expected failure, the known bug.

## 4. The report and a trace (about 1–2 minutes)

```bat
npm run report
```
- Show the list of tests, all green, and filter by `@orders`.
- Open **"shipping an order takes its stock out of the warehouse"** and click the **trace**.
- Step through: the click on "Move to Shipped", the page at that moment, then the stock check showing 840.

> "Every test keeps a trace: each step, what the page looked like, and the network and console. If something fails in CI, we can see exactly why."

## 5. Code coverage (about 1 minute)

```bat
scripts\coverage.cmd
```
Then open `playwright\coverage-report\index.html` in Edge.

> "While the tests run, we measure which lines of the app's code they exercise. We're at about 98% of statements and 98% of functions. The few lines left are code the user interface can't reach, like 'order not found'."

Click into `services/order.service.ts` to show the covered (green) and uncovered (red) lines.

## 6. CI on GitHub (about 1 minute)

Open the repository → **Actions** → the latest **E2E tests** run.

> "On every push and pull request GitHub runs the same suite and the coverage job. The run page shows the test count and coverage, and the report with traces can be downloaded."

Show the green checks on the pull request, and the **Summary** tab with the inventory and coverage tables.

## 7. The automated walkthrough (about 1.5 minutes)

Open `playwright\demo-video\forge-inventory-demo.webm` in Edge.

> "Finally, this is one test recorded as video: it signs in, adds a product, adjusts stock, creates and ships an order, and checks what a viewer can't do. Each caption appears only after its check has passed."

## Close

> "So: N automated tests, measured code coverage, every feature mapped to tests, running on every push. Along the way the suite found one real bug: error messages aren't displayed. It also raised one open question: should viewers be able to reset the demo data?"
