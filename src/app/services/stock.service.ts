import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { DbService } from '../core/db.service';
import { respond } from '../core/respond';
import { StockMovement } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StockService {
  constructor(private db: DbService, private auth: AuthService) {}

  movements(limit = 20): Observable<StockMovement[]> {
    return respond(() =>
      this.db.query<StockMovement>('SELECT id, ts, sku, type, qty, note FROM stock_movements ORDER BY id DESC LIMIT ?', [limit])
    );
  }

  adjust(sku: string, qty: number, note: string): Observable<number> {
    return respond(() => {
      this.auth.requireManager();
      return this.db.transaction(() => this.apply(this.db, sku, qty, 'Adjust', note));
    });
  }

  /** Moves stock inside a transaction that the caller already started (used when shipping an order). */
  apply(db: DbService, sku: string, qty: number, type: StockMovement['type'], note: string): number {
    const row = db.queryOne<{ stock: number }>('SELECT stock FROM products WHERE sku = ?', [sku]);
    if (!row) {
      throw new Error('Product ' + sku + ' was not found.');
    }
    const next = row.stock + qty;
    if (next < 0) {
      throw new Error('Not enough stock of ' + sku + ': ' + row.stock + ' on hand.');
    }
    db.run('UPDATE products SET stock = ? WHERE sku = ?', [next, sku]);
    db.run('INSERT INTO stock_movements (ts, sku, type, qty, note) VALUES (?,?,?,?,?)', [
      new Date().toISOString().slice(0, 16).replace('T', ' '), sku, type, qty, note
    ]);
    return next;
  }
}
