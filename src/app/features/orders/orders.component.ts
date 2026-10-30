import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../core/auth.service';
import { ORDER_FLOW, Order } from '../../models/models';
import { OrderService } from '../../services/order.service';
import { GridColumn } from '../../shared/grid/grid.component';
import { orderPill } from '../../shared/pills';
import { OrderDetailComponent } from './order-detail.component';
import { OrderFormComponent } from './order-form.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  readonly columns: GridColumn[] = [
    { key: 'no', header: 'Order', mono: true },
    { key: 'customer', header: 'Customer' },
    { key: 'placed', header: 'Placed', mono: true },
    { key: 'due', header: 'Due', mono: true },
    { key: 'total', header: 'Value', type: 'currency' },
    { key: 'status', header: 'Status', type: 'pill', pill: orderPill, sortValue: o => ORDER_FLOW.indexOf(o.status) }
  ];
  readonly statuses = ORDER_FLOW.concat(['Cancelled']);

  orders: Order[] = [];
  rows: Order[] = [];
  statusFilter = '';
  loading = true;

  constructor(private service: OrderService, private modal: NgbModal, public auth: AuthService) {}

  ngOnInit(): void {
    this.reload();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilter();
  }

  open(order: Order): void {
    const ref = this.modal.open(OrderDetailComponent, { size: 'lg' });
    ref.componentInstance.orderNo = order.no;
    ref.componentInstance.changed.subscribe(() => this.reload());
    ref.result.then(() => undefined, () => undefined);
  }

  create(): void {
    const ref = this.modal.open(OrderFormComponent, { size: 'lg' });
    ref.componentInstance.saved.subscribe(() => this.reload());
    ref.result.then(() => undefined, () => undefined);
  }

  reload(): void {
    this.service.list().subscribe(orders => {
      this.loading = false;
      this.orders = orders;
      this.applyFilter();
    });
  }

  private applyFilter(): void {
    this.rows = this.statusFilter ? this.orders.filter(o => o.status === this.statusFilter) : this.orders;
  }
}
