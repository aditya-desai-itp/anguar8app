import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { DbService } from '../core/db.service';
import { respond } from '../core/respond';
import { Product } from '../models/models';

const PRODUCT_COLUMNS =
  'sku, name, category, unit, cost, price, stock, min_level AS minLevel, max_level AS maxLevel, bin, supplier';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private db: DbService, private auth: AuthService) {}

  list(): Observable<Product[]> {
    return respond(() => this.db.query<Product>('SELECT ' + PRODUCT_COLUMNS + ' FROM products ORDER BY sku'));
  }

  get(sku: string): Observable<Product> {
    return respond(() => {
      const product = this.db.queryOne<Product>('SELECT ' + PRODUCT_COLUMNS + ' FROM products WHERE sku = ?', [sku]);
      if (!product) {
        throw new Error('Product ' + sku + ' was not found.');
      }
      return product;
    });
  }

  create(p: Product): Observable<Product> {
    return respond(() => {
      this.auth.requireManager();
      if (this.db.queryOne('SELECT sku FROM products WHERE sku = ?', [p.sku])) {
        throw new Error('SKU ' + p.sku + ' already exists.');
      }
      this.db.run('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
        p.sku, p.name, p.category, p.unit, p.cost, p.price, p.stock, p.minLevel, p.maxLevel, p.bin, p.supplier
      ]);
      return p;
    });
  }

  categories(): Observable<string[]> {
    return respond(() =>
      this.db.query<{ category: string }>('SELECT DISTINCT category FROM products ORDER BY category').map(r => r.category)
    );
  }
}
