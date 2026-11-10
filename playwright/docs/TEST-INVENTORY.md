# Playwright test inventory

Generated 2026-11-10 by `npm run inventory` from `playwright test --list`.

**Total: 118 tests** in 9 spec files (Chromium; 16 tagged `@smoke`; 1 marked as a known app bug).

## By spec file

| Spec file | Tests |
|---|---|
| `tests/orders.spec.ts` | 25 |
| `tests/products.spec.ts` | 18 |
| `tests/rbac.spec.ts` | 18 |
| `tests/navigation.spec.ts` | 16 |
| `tests/auth.spec.ts` | 14 |
| `tests/stock.spec.ts` | 14 |
| `tests/dashboard.spec.ts` | 6 |
| `tests/resilience.spec.ts` | 5 |
| `tests/persistence.spec.ts` | 2 |

## By area tag

| Tag | Tests |
|---|---|
| `@orders` | 25 |
| `@products` | 18 |
| `@rbac` | 18 |
| `@smoke` | 16 |
| `@navigation` | 16 |
| `@auth` | 14 |
| `@stock` | 14 |
| `@dashboard` | 6 |
| `@resilience` | 5 |
| `@persistence` | 2 |

## By who is signed in

| Role | Tests |
|---|---|
| Manager | 77 |
| Viewer | 24 |
| Signed out | 17 |

## Known app bugs (expected failures)

- `tests/resilience.spec.ts` › when the saved database is corrupted › the user sees a "something went wrong" message

## Every test

### tests/auth.spec.ts

1. signing in › manager signs in and lands on the dashboard `@auth` `@smoke`
2. signing in › viewer signs in with the read-only role `@auth`
3. signing in › wrong password shows an error and stays on the login page `@auth` `@smoke`
4. signing in › unknown user is refused `@auth`
5. signing in › password in the wrong case is refused `@auth`
6. signing in › another user's password is refused `@auth`
7. signing in › spaces around the username are ignored `@auth`
8. signing in › the error clears after a correct sign in attempt `@auth`
9. signing in › sign in button is disabled while the username is empty `@auth`
10. signing in › sign in button is disabled while the password is empty `@auth`
11. signing in › Enter in the password field signs in `@auth`
12. signing in › a protected page redirects to login and returns there after signing in `@auth`
13. signing out › sign out returns to login and the app stays locked `@auth` `@smoke`
14. signing out › after signing out, another user can sign in `@auth`

### tests/dashboard.spec.ts

1. dashboard › shows the KPIs calculated from the seed data `@dashboard` `@smoke`
2. dashboard › lists the items that need reordering `@dashboard`
3. dashboard › shows the five most recent stock movements `@dashboard`
4. dashboard › clicking a reorder alert opens the product `@dashboard`
5. dashboard › restocking from a reorder alert updates the dashboard `@dashboard`
6. dashboard › order changes are reflected in the open order counts `@dashboard`

### tests/navigation.spec.ts

1. navigation as Manager › the sidebar opens every page `@navigation` `@smoke`
2. navigation as Manager › dashboard links open the stock page `@navigation`
3. navigation as Manager › browser back and forward move between pages `@navigation`
4. navigation as Manager › the root and unknown addresses go to the dashboard `@navigation`
5. navigation as Manager › the login page sends a signed-in user to the dashboard `@navigation`
6. navigation as Manager › reloading keeps the user signed in on the same page `@navigation`
7. navigation as Viewer › the sidebar opens every page `@navigation` `@smoke`
8. navigation as Viewer › dashboard links open the stock page `@navigation`
9. navigation as Viewer › browser back and forward move between pages `@navigation`
10. navigation as Viewer › the root and unknown addresses go to the dashboard `@navigation`
11. navigation as Viewer › the login page sends a signed-in user to the dashboard `@navigation`
12. navigation as Viewer › reloading keeps the user signed in on the same page `@navigation`
13. navigation while signed out › /dashboard asks to sign in first and then opens `@navigation`
14. navigation while signed out › /products asks to sign in first and then opens `@navigation`
15. navigation while signed out › /stock asks to sign in first and then opens `@navigation`
16. navigation while signed out › /orders asks to sign in first and then opens `@navigation`

### tests/orders.spec.ts

1. orders › lists the newest orders first, six per page `@orders`
2. orders › sorting by status follows the order flow `@orders`
3. orders › filters by status `@orders`
4. orders › manager creates an order with two lines `@orders` `@smoke`
5. orders › an order needs a customer and a due date `@orders`
6. orders › moves a new order to Confirmed `@orders`
7. orders › shipping an order takes its stock out of the warehouse `@orders` `@smoke`
8. orders › an order cannot ship when a product is out of stock `@orders` `@smoke`
9. orders › manager cancels an open order `@orders`
10. orders › a shipped order can only move to Delivered `@orders`
11. orders › New order (SO-2414) offers Move to Confirmed and Cancel `@orders`
12. orders › Confirmed order (SO-2417) offers Move to Picking and Cancel `@orders`
13. orders › Picking order (SO-2418) offers Move to Shipped and Cancel `@orders`
14. orders › Shipped order (SO-2416) offers Move to Delivered `@orders`
15. orders › Delivered order (SO-2413) offers no next step `@orders`
16. orders › Cancelled order (SO-2411) offers no next step `@orders`
17. orders › an order goes through every step from New to Delivered `@orders`
18. orders › a Confirmed order can be cancelled and its stock is not touched `@orders`
19. orders › a Picking order can be cancelled and its stock is not touched `@orders`
20. orders › Escape closes the order details `@orders`
21. orders › a new order appears under the New filter `@orders`
22. orders › order lines can be added and removed `@orders`
23. orders › an order with a quantity of 0 is not created `@orders`
24. orders › an order without a product is not created `@orders`
25. orders › the due date can be picked from the calendar `@orders`

### tests/persistence.spec.ts

1. saved data › changes survive a reload and "Reset demo data" restores the seed `@persistence` `@smoke`
2. saved data › "Reset demo data" deletes the saved database before reloading `@persistence`

### tests/products.spec.ts

1. products › lists products by SKU, six per page `@products`
2. products › search filters by name, SKU and category `@products`
3. products › shows the stock status of each product `@products`
4. products › clicking a row opens the product details `@products`
5. products › manager adds a new product `@products` `@smoke`
6. products › a SKU in the wrong format is rejected `@products`
7. products › required fields are flagged when the form is submitted empty `@products`
8. products › search ignores case and matches part of a SKU `@products`
9. products › clicking a column header sorts the grid `@products`
10. products › sorting by status puts empty and low stock first `@products`
11. products › adjusting stock from the products page refreshes the grid `@products`
12. products › rejects Name = "61 characters" `@products`
13. products › rejects Unit cost = "-1" `@products`
14. products › rejects Unit price = "-0.01" `@products`
15. products › rejects Max level = "0" `@products`
16. products › cancel and the close button discard the new product `@products`
17. products › a new product shows up on the stock page and in the order form `@products`
18. products › a duplicate SKU is refused `@products` `@smoke`

### tests/rbac.spec.ts

1. viewer (read-only) role › can see everything › dashboard greets the viewer and shows the same figures `@rbac`
2. viewer (read-only) role › can see everything › can search products and open their details `@rbac`
3. viewer (read-only) role › can see everything › can filter stock and page through it `@rbac`
4. viewer (read-only) role › can see everything › can filter orders and read an order `@rbac`
5. viewer (read-only) role › the rules hold even if a disabled button is forced on › adding a product is refused `@rbac`
6. viewer (read-only) role › the rules hold even if a disabled button is forced on › creating an order is refused `@rbac`
7. viewer (read-only) role › the rules hold even if a disabled button is forced on › adjusting stock is refused `@rbac` `@smoke`
8. viewer (read-only) role › cannot change anything › New product is disabled `@rbac`
9. viewer (read-only) role › cannot change anything › New order is disabled `@rbac`
10. viewer (read-only) role › cannot change anything › stock adjustment is locked on the products page `@rbac` `@smoke`
11. viewer (read-only) role › cannot change anything › stock adjustment is locked on the stock page `@rbac`
12. viewer (read-only) role › cannot change anything › stock adjustment is locked from a dashboard reorder alert `@rbac`
13. viewer (read-only) role › cannot change anything › no order actions on a New order (SO-2414) `@rbac`
14. viewer (read-only) role › cannot change anything › no order actions on a Confirmed order (SO-2417) `@rbac`
15. viewer (read-only) role › cannot change anything › no order actions on a Picking order (SO-2418) `@rbac`
16. viewer (read-only) role › cannot change anything › no order actions on a Shipped order (SO-2416) `@rbac`
17. viewer (read-only) role › cannot change anything › no order actions on a Delivered order (SO-2413) `@rbac`
18. viewer (read-only) role › cannot change anything › no order actions on a Cancelled order (SO-2411) `@rbac`

### tests/resilience.spec.ts

1. when localStorage is blocked › the app still loads the sample data and accepts changes `@resilience`
2. when localStorage is blocked › changes are not kept after a reload, and reset still works `@resilience`
3. when the saved database is corrupted › the user sees a "something went wrong" message `@resilience` **(known bug)**
4. when the saved database is corrupted › "Reset demo data" recovers the app `@resilience`
5. when sessionStorage is blocked › users can sign in and out, but a reload asks to sign in again `@resilience`

### tests/stock.spec.ts

1. stock › lists the ten products eight per page `@stock`
2. stock › "only below reorder level" shows just the low items `@stock`
3. stock › receiving stock clears the low status `@stock` `@smoke`
4. stock › items on the second page can be opened `@stock`
5. stock › stock cannot go below zero `@stock` `@smoke`
6. stock › taking out all remaining stock marks the item Out `@stock`
7. stock › taking stock below the reorder level marks the item Low `@stock`
8. stock › apply is disabled for a decimal quantity `@stock`
9. stock › Escape closes the details without changing stock `@stock`
10. stock › the grid works from the keyboard: Enter opens a row, arrows move `@stock`
11. stock › sorting by level and by status puts the emptiest items first `@stock`
12. stock › applying an adjustment of 0 changes nothing `@stock`
13. stock › the confirmation message disappears by itself `@stock`
14. stock › apply is disabled without a reason `@stock`
