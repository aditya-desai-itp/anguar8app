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
