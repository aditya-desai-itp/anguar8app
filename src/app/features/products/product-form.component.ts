import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '../../core/toast.service';
import { Product } from '../../models/models';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  categories: string[] = [];
  saving = false;

  form = this.fb.group({
    sku: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}$/)]],
    name: ['', [Validators.required, Validators.maxLength(60)]],
    category: ['', Validators.required],
    unit: ['pcs', Validators.required],
    cost: [null, [Validators.required, Validators.min(0)]],
    price: [null, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minLevel: [0, [Validators.required, Validators.min(0)]],
    maxLevel: [100, [Validators.required, Validators.min(1)]],
    bin: ['', Validators.required],
    supplier: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private products: ProductService,
    private toast: ToastService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.products.categories().subscribe(c => (this.categories = c));
  }

  invalid(name: string): boolean {
    const c = this.form.get(name) as AbstractControl;
    return c.invalid && (c.dirty || c.touched);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value: Product = { ...this.form.value, sku: String(this.form.value.sku).toUpperCase() };
    this.products.create(value).subscribe(
      p => {
        this.toast.show(p.sku + ' added.');
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
