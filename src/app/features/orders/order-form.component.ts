import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '../../core/toast.service';
import { Product } from '../../models/models';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html'
})
export class OrderFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  products: Product[] = [];
  saving = false;

  form = this.fb.group({
    customer: ['', [Validators.required, Validators.maxLength(60)]],
    due: ['', Validators.required],
    lines: this.fb.array([])
  });

  constructor(
    private fb: FormBuilder,
    private orders: OrderService,
    private productService: ProductService,
    private toast: ToastService,
    public activeModal: NgbActiveModal
  ) {}

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.productService.list().subscribe(p => (this.products = p));
    this.addLine();
  }

  addLine(): void {
    this.lines.push(this.fb.group({ sku: ['', Validators.required], qty: [1, [Validators.required, Validators.min(1)]] }));
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  private toIso(d: NgbDateStruct): string {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    return d.year + '-' + pad(d.month) + '-' + pad(d.day);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.value;
    this.orders.create({ ...value, due: this.toIso(value.due) }).subscribe(
      o => {
        this.toast.show(o.no + ' created.');
        this.saved.emit();
        this.activeModal.close();
      },
      err => {
        this.saving = false;
        this.toast.error(err.message);
      }
    );
  }
}
