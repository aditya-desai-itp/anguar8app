import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { DbService } from '../core/db.service';
import { respond } from '../core/respond';
import { NewOrder, Order, OrderLine, OrderStatus, nextStatus } from '../models/models';
import { StockService } from './stock.service';

const ORDER_SELECT =
  'SELECT o.no, o.customer, o.placed, o.due, o.status, ' +
  'COALESCE(SUM(l.qty * p.price), 0) AS total ' +
  'FROM orders o LEFT JOIN order_lines l ON l.order_no = o.no LEFT JOIN products p ON p.sku = l.sku ';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private db: DbService, private auth: AuthService, private stock: StockService) {}

  list(): Observable<Order[]> {
    return respond(() => this.db.query<Order>(ORDER_SELECT + 'GROUP BY o.no ORDER BY o.no DESC'));
  }

  get(no: string): Observable<Order> {
    return respond(() => this.load(no));
  }

  create(order: NewOrder): Observable<Order> {
    return respond(() => {
      this.auth.requireManager();
      return this.db.transaction(() => {
        const last = this.db.queryOne<{ no: string }>('SELECT no FROM orders ORDER BY no DESC LIMIT 1');
        const no = 'SO-' + ((last ? parseInt(last.no.slice(3), 10) : 2400) + 1);
        const today = new Date().toISOString().slice(0, 10);
        this.db.run('INSERT INTO orders VALUES (?,?,?,?,?)', [no, order.customer, today, order.due, 'New']);
        order.lines.forEach(l => this.db.run('INSERT INTO order_lines (order_no, sku, qty) VALUES (?,?,?)', [no, l.sku, l.qty]));
        return this.load(no);
      });
    });
  }

  /** Moves an order one step forward. Shipping takes the stock out of the warehouse. */
  advance(no: string): Observable<Order> {
    return respond(() => {
      this.auth.requireManager();
      return this.db.transaction(() => {
        const order = this.load(no);
        const next = nextStatus(order.status);
        if (!next) {
          throw new Error(order.no + ' cannot move forward from ' + order.status + '.');
        }
        if (next === 'Shipped') {
          (order.lines || []).forEach(l => this.stock.apply(this.db, l.sku, -l.qty, 'Pick', order.no));
        }
        this.setStatus(no, next);
        return this.load(no);
      });
    });
  }

  cancel(no: string): Observable<Order> {
    return respond(() => {
      this.auth.requireManager();
      return this.db.transaction(() => {
        const order = this.load(no);
        if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
          throw new Error(order.no + ' is already ' + order.status.toLowerCase() + ' and cannot be cancelled.');
        }
        this.setStatus(no, 'Cancelled');
        return this.load(no);
      });
    });
  }

  private setStatus(no: string, status: OrderStatus): void {
    this.db.run('UPDATE orders SET status = ? WHERE no = ?', [status, no]);
  }

  private load(no: string): Order {
    const order = this.db.queryOne<Order>(ORDER_SELECT + 'WHERE o.no = ? GROUP BY o.no', [no]);
    if (!order) {
      throw new Error('Order ' + no + ' was not found.');
    }
    order.lines = this.db.query<OrderLine>(
      'SELECT l.sku, p.name, l.qty, p.price, p.stock AS onHand FROM order_lines l ' +
      'JOIN products p ON p.sku = l.sku WHERE l.order_no = ? ORDER BY l.id',
      [no]
    );
    return order;
  }
}
