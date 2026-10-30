import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { Order, Product, StockMovement, stockState } from '../../models/models';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { StockService } from '../../services/stock.service';
import { ProductDetailComponent } from '../../shared/product-detail/product-detail.component';

interface DashboardView {
  inventoryValue: number;
  openOrders: number;
  dueThisWeek: number;
  reorder: Product[];
  movements: StockMovement[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  view$!: Observable<DashboardView>;
  today = new Date();

  constructor(
    public auth: AuthService,
    private products: ProductService,
    private orders: OrderService,
    private stock: StockService,
    private modal: NgbModal
  ) {}

  ngOnInit(): void {
    this.load();
  }

  open(product: Product): void {
    const ref = this.modal.open(ProductDetailComponent);
    ref.componentInstance.product = product;
    ref.componentInstance.changed.subscribe(() => this.load());
    ref.result.then(() => undefined, () => undefined);
  }

  load(): void {
    this.view$ = forkJoin(this.products.list(), this.orders.list(), this.stock.movements(5)).pipe(
      map(([products, orders, movements]) => this.build(products, orders, movements))
    );
  }

  private build(products: Product[], orders: Order[], movements: StockMovement[]): DashboardView {
    const open = orders.filter(o => ['New', 'Confirmed', 'Picking'].indexOf(o.status) >= 0);
    const weekAhead = new Date(this.today.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    return {
      inventoryValue: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
      openOrders: open.length,
      dueThisWeek: open.filter(o => o.due <= weekAhead).length,
      reorder: products.filter(p => stockState(p) !== 'ok'),
      movements
    };
  }
}
