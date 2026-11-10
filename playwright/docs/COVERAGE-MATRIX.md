# Forge Inventory: feature coverage matrix

Each row is something the app does or a rule it enforces, with the Playwright tests that check it.
The feature list comes from the routes (`app-routing.module.ts`), the services and their rules
(`requireManager`, the stock and order rules) and the form validators. Test counts are on Chromium.
The full numbered list is in [TEST-INVENTORY.md](TEST-INVENTORY.md) (`npm run inventory`).

Key: **M** = Manager, **V** = Viewer (read only), **—** = signed out.

## Sign in and session (`auth.spec.ts`, `navigation.spec.ts`, `resilience.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| Manager and viewer can sign in; the name and role are shown | M V | auth: manager signs in, viewer signs in |
| Wrong credentials are refused with a message (wrong password, unknown user, wrong letter case, another user's password) | — | auth: 4 tests |
| Spaces around the username are ignored; Enter submits | — | auth: 2 tests |
| Sign in is disabled while a field is empty | — | auth: 2 tests |
| The error clears on a correct second attempt | — | auth |
| Sign out returns to login and locks the app; another user can then sign in | M | auth: 2 tests |
| Every page asks to sign in first, then opens that page (`returnUrl`) | — | navigation: 4 tests + auth |
| A signed-in user who opens `/login` goes to the dashboard | M V | navigation: 2 tests |
| Reload keeps the user signed in | M V | navigation: 2 tests |
| With sessionStorage blocked, sign in still works but isn't remembered | — | resilience |

## Navigation (`navigation.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| The sidebar opens Dashboard, Products, Stock and Orders, and highlights the active page | M V | navigation: 2 tests |
| Dashboard links "View stock" and "All movements" open Stock | M V | navigation: 2 tests |
| Browser back and forward | M V | navigation: 2 tests |
| `/` and unknown addresses go to the dashboard | M V | navigation: 2 tests |

## Dashboard (`dashboard.spec.ts`, `rbac.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| KPIs: inventory value at cost, open orders, items at or below reorder level, open orders due within 7 days (fixed clock) | M V | dashboard, rbac |
| Reorder alerts list the low and out-of-stock items | M V | dashboard, rbac |
| The 5 most recent stock movements, newest first | M V | dashboard, rbac |
| A reorder alert opens the product; restocking updates the alerts, the counts and the value | M | dashboard: 2 tests |
| Shipping an order updates the open-order counts | M | dashboard |
| A viewer can open an alert but can't adjust stock | V | rbac |

## Products (`products.spec.ts`, `rbac.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| The grid is sorted by SKU, 6 per page, with paging | M | products |
| Search by name, SKU or category; ignores case; matches part of a SKU; no-match state | M V | products: 2 tests, rbac |
| Sorting by price (both directions) and by status | M | products: 2 tests |
| Status pills (In stock, Low, Out), price and stock formatting | M | products |
| A row opens the product details | M V | products, rbac |
| Add a product; it appears on Stock and in the order form | M | products: 2 tests |
| Validation: SKU format `ABC-1234`; name ≤ 60 characters; cost and price ≥ 0; max level ≥ 1; required fields | M | products: 6 tests |
| A duplicate SKU is refused | M | products |
| Cancel and the close button discard the form | M | products |
| Adjusting stock from Products refreshes the grid | M | products |
| A viewer can't add products: the button is disabled, **and the service refuses even if the button is forced on** | V | rbac: 2 tests |

## Stock (`stock.spec.ts`, `rbac.spec.ts`, `persistence.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| The grid shows 8 per page with paging; second-page items open | M V | stock: 2 tests, rbac |
| "Only below reorder level" filter, on and off | M V | stock, rbac |
| Sorting by level and by status | M | stock |
| Adjust stock up (Low → In stock), to exactly 0 (→ Out), below reorder (→ Low); each adds a movement | M | stock: 3 tests |
| **Stock can't go below zero** | M | stock |
| Apply is disabled without a reason or for a decimal; 0 changes nothing | M | stock: 3 tests |
| Escape closes the details without saving; Enter on a cell opens them | M | stock: 2 tests |
| The confirmation message hides itself | M | stock |
| A viewer can't adjust stock anywhere (Products, Stock, dashboard), **and the service refuses even if forced** | V | rbac: 4 tests |

## Orders (`orders.spec.ts`, `rbac.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| The grid shows newest first, 6 per page, with values | M | orders |
| Filter by every status, and back to all | M V | orders: 2 tests, rbac |
| Sorting by status follows the order flow | M | orders |
| Create an order with several lines; number, total and due date are correct | M | orders: 2 tests |
| Validation: customer, due date and product are required; quantity ≥ 1 | M | orders: 3 tests |
| Add and remove lines (the last line can't be removed) | M | orders |
| Pick the due date from the calendar | M | orders |
| **The buttons offered for each of the 6 statuses** (next step, cancel) | M | orders: 6 tests |
| The full flow New → Confirmed → Picking → Shipped → Delivered | M | orders |
| **Shipping takes the stock out** and records Pick movements | M | orders, dashboard |
| **An order can't ship when a product is out of stock** | M | orders |
| Cancel from New, Confirmed or Picking; stock untouched; no cancel after shipping | M | orders: 4 tests |
| Escape closes the details | M | orders |
| A viewer gets no actions on an order in any of the 6 statuses; New order is disabled; **the service refuses even if forced** | V | rbac: 8 tests |

## Saved data and resilience (`persistence.spec.ts`, `resilience.spec.ts`)

| Feature / rule | Roles | Checked by |
|---|---|---|
| Changes survive a reload (database saved to localStorage) | M | persistence |
| "Reset demo data" deletes the saved copy and restores the sample data | M | persistence: 2 tests |
| With localStorage blocked the app still works, just without saving | M | resilience: 2 tests |
| A corrupted saved database: "Reset demo data" recovers the app | M | resilience |
| A corrupted saved database: the "Something went wrong" message is shown | M | resilience: **known bug, see below** |
| No test may log a browser error or throw an uncaught exception | all | built into every test (fixture) |

## Findings for the team

1. **Bug: the global error message never appears.** When an unexpected error happens (for example, a corrupted
   saved database), `GlobalErrorHandler` logs it and asks for the "Something went wrong" message, but the message
   is never shown and the dashboard stays on "Loading…". The test is marked as an expected failure until the app is fixed.
2. **Question: viewers can use "Reset demo data".** A read-only user can wipe all saved changes in that browser,
   including a manager's. It isn't tested either way until the intended behaviour is confirmed.

## Code coverage

See the coverage report (`npm run coverage` → `coverage-report/index.html`) and the summary in the README.
