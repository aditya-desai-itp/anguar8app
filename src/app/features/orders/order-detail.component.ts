import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ORDER_FLOW, Order, nextStatus } from '../../models/models';
import { OrderService } from '../../services/order.service';

/** Pop-up opened from the orders grid. Loads the order with its lines and offers the next status step. */
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit {
  @Input() orderNo!: string;
  @Output() changed = new EventEmitter<void>();

  readonly flow = ORDER_FLOW;
  order: Order | null = null;
  busy = false;

  constructor(
    private service: OrderService,
    private toast: ToastService,
    public activeModal: NgbActiveModal,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.service.get(this.orderNo).subscribe(o => (this.order = o), err => this.fail(err));
  }

  /** The status buttons are disabled while a request runs, which drops focus out of the modal and stops ngb's own Esc handling. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.activeModal.dismiss();
  }

  get next(): string | null {
    return this.order ? nextStatus(this.order.status) : null;
  }

  get canCancel(): boolean {
    return !!this.order && ['New', 'Confirmed', 'Picking'].indexOf(this.order.status) >= 0;
  }

  stepClass(index: number): string {
    const current = this.order ? ORDER_FLOW.indexOf(this.order.status) : -1;
    return index < current ? 'done' : index === current ? 'cur' : '';
  }

  isShort(line: { qty: number; onHand: number }): boolean {
    return !!this.order && ['New', 'Confirmed', 'Picking'].indexOf(this.order.status) >= 0 && line.onHand < line.qty;
  }

  advance(): void {
    this.run(this.service.advance(this.orderNo), o => o.no + ' is now ' + o.status + '.');
  }

  cancel(): void {
    this.run(this.service.cancel(this.orderNo), o => o.no + ' was cancelled.');
  }

  private run(call: Observable<Order>, message: (o: Order) => string): void {
    this.busy = true;
    call.subscribe(
      o => {
        this.busy = false;
        this.order = o;
        this.toast.show(message(o));
        this.changed.emit();
      },
      err => this.fail(err)
    );
  }

  private fail(err: Error): void {
    this.busy = false;
    this.toast.error(err.message);
  }
}
