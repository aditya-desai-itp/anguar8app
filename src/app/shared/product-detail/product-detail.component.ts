import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Product, stockState } from '../../models/models';
import { StockService } from '../../services/stock.service';

/** Modal opened from the product, stock and dashboard screens. Shows details and lets a manager adjust stock. */
@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent {
  @Input() product!: Product;
  @Output() changed = new EventEmitter<void>();

  saving = false;
  form = this.fb.group({
    qty: [0, [Validators.required, Validators.pattern(/^-?\d+$/)]],
    note: ['Manual adjustment', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private stock: StockService,
    private toast: ToastService,
    public activeModal: NgbActiveModal,
    public auth: AuthService
  ) {
    if (!auth.isManager) {
      this.form.disable();
    }
  }

  get state(): string {
    return stockState(this.product);
  }

  get levelPct(): number {
    return Math.min(100, Math.round((this.product.stock / this.product.maxLevel) * 100));
  }

  apply(): void {
    const qty = Number(this.form.value.qty);
    if (this.form.invalid || qty === 0) {
      return;
    }
    this.saving = true;
    this.stock.adjust(this.product.sku, qty, this.form.value.note).subscribe(
      stock => {
        this.toast.show(this.product.sku + ' now has ' + stock + ' on hand.');
        this.changed.emit();
        this.activeModal.close();
      },
      err => {
        this.saving = false;
        this.toast.error(err.message);
      }
    );
  }
}
