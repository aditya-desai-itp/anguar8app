CREATE TABLE users (
  username TEXT PRIMARY KEY, password TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL
);
CREATE TABLE products (
  sku TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, unit TEXT NOT NULL,
  cost REAL NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL,
  min_level INTEGER NOT NULL, max_level INTEGER NOT NULL, bin TEXT NOT NULL, supplier TEXT NOT NULL
);
CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, sku TEXT NOT NULL,
  type TEXT NOT NULL, qty INTEGER NOT NULL, note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE orders (
  no TEXT PRIMARY KEY, customer TEXT NOT NULL, placed TEXT NOT NULL, due TEXT NOT NULL, status TEXT NOT NULL
);
CREATE TABLE order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL, sku TEXT NOT NULL, qty INTEGER NOT NULL
);

-- Demo accounts only. Passwords are plain text because this is mock data with no backend.
INSERT INTO users VALUES ('planner', 'factory123', 'Planner', 'Manager');
INSERT INTO users VALUES ('viewer', 'viewer123', 'Viewer', 'Viewer');

INSERT INTO products VALUES ('BRK-1020', 'Brake bracket, zinc', 'Brackets', 'pcs', 3.8, 7.5, 1240, 400, 2000, 'A-03-2', 'Northline Steel');
INSERT INTO products VALUES ('BRK-1044', 'Mounting bracket, 90 deg', 'Brackets', 'pcs', 2.9, 6.2, 310, 500, 1800, 'A-03-4', 'Northline Steel');
INSERT INTO products VALUES ('FST-2001', 'Hex bolt M8 x 40', 'Fasteners', 'box/100', 6.4, 11, 86, 60, 250, 'B-01-1', 'Kessler Fixings');
INSERT INTO products VALUES ('FST-2015', 'Lock nut M8', 'Fasteners', 'box/100', 4.1, 8, 42, 60, 250, 'B-01-2', 'Kessler Fixings');
INSERT INTO products VALUES ('GSK-3100', 'Rubber gasket 60 mm', 'Seals', 'pcs', 0.9, 2.4, 5200, 1500, 6000, 'C-02-1', 'Marlow Polymers');
INSERT INTO products VALUES ('GSK-3120', 'Silicone gasket 80 mm', 'Seals', 'pcs', 1.7, 3.9, 880, 800, 3500, 'C-02-3', 'Marlow Polymers');
INSERT INTO products VALUES ('PNL-4010', 'Steel panel 600 x 400', 'Panels', 'pcs', 18, 34, 64, 30, 120, 'D-01-1', 'Northline Steel');
INSERT INTO products VALUES ('PNL-4025', 'Aluminium panel 600 x 400', 'Panels', 'pcs', 26, 49, 0, 20, 90, 'D-01-3', 'Alu-Tec');
INSERT INTO products VALUES ('MTR-5002', 'Drive motor 0.75 kW', 'Assemblies', 'pcs', 96, 168, 23, 10, 40, 'E-02-1', 'Voltek');
INSERT INTO products VALUES ('ASM-6100', 'Gearbox assembly GB-6', 'Assemblies', 'pcs', 240, 410, 11, 8, 30, 'E-04-2', 'In-house');

INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES ('2026-10-28 14:12', 'PNL-4025', 'Pick', -30, 'SO-2410');
INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES ('2026-10-28 11:40', 'BRK-1020', 'Receipt', 800, 'PO-881');
INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES ('2026-10-27 16:05', 'FST-2015', 'Pick', -30, 'SO-2412');
INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES ('2026-10-27 09:30', 'MTR-5002', 'Receipt', 12, 'PO-879');
INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES ('2026-10-26 15:22', 'GSK-3120', 'Adjust', -20, 'Cycle count');

INSERT INTO orders VALUES ('SO-2418', 'Hartwell Machinery', '2026-10-26', '2026-11-04', 'Picking');
INSERT INTO orders VALUES ('SO-2417', 'Delmar Conveyors', '2026-10-25', '2026-11-02', 'Confirmed');
INSERT INTO orders VALUES ('SO-2416', 'Oakridge Packaging', '2026-10-24', '2026-10-30', 'Shipped');
INSERT INTO orders VALUES ('SO-2415', 'Brightline Auto', '2026-10-22', '2026-10-29', 'Shipped');
INSERT INTO orders VALUES ('SO-2414', 'Tolland Pumps', '2026-10-21', '2026-11-06', 'New');
INSERT INTO orders VALUES ('SO-2413', 'Hartwell Machinery', '2026-10-19', '2026-10-28', 'Delivered');
INSERT INTO orders VALUES ('SO-2412', 'Oakridge Packaging', '2026-10-18', '2026-10-27', 'Delivered');
INSERT INTO orders VALUES ('SO-2411', 'Delmar Conveyors', '2026-10-16', '2026-10-25', 'Cancelled');

INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2418', 'BRK-1020', 400);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2418', 'FST-2001', 20);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2417', 'PNL-4025', 30);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2417', 'GSK-3100', 600);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2416', 'GSK-3120', 1200);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2415', 'MTR-5002', 6);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2415', 'ASM-6100', 4);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2414', 'ASM-6100', 10);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2414', 'BRK-1044', 250);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2413', 'PNL-4010', 40);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2412', 'FST-2015', 30);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2412', 'FST-2001', 30);
INSERT INTO order_lines (order_no, sku, qty) VALUES ('SO-2411', 'MTR-5002', 2);
