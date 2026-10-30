import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { Product } from '../../models/models';
import { ProductService } from '../../services/product.service';
import { GridColumn } from '../../shared/grid/grid.component';
import { ProductDetailComponent } from '../../shared/product-detail/product-detail.component';
import { stockPill } from '../../shared/pills';
import { ProductFormComponent } from './product-form.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit, OnDestroy {
  readonly columns: GridColumn[] = [
    { key: 'sku', header: 'SKU', mono: true },
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price', type: 'currency' },
    { key: 'stock', header: 'On hand', type: 'number' },
    { key: 'status', header: 'Status', type: 'pill', pill: stockPill, sortValue: p => p.stock / p.minLevel }
  ];

  search = new FormControl('');
  rows: Product[] = [];
  loading = true;

  private readonly products$ = new BehaviorSubject<Product[]>([]);
  private readonly destroy$ = new Subject<void>();

  constructor(private service: ProductService, private modal: NgbModal, public auth: AuthService) {}

  ngOnInit(): void {
    combineLatest(this.products$, this.search.valueChanges.pipe(startWith('')))
      .pipe(
        map(([products, term]) => {
          const q = String(term).trim().toLowerCase();
          return products.filter(p => !q || (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().indexOf(q) >= 0);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(rows => (this.rows = rows));
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  open(product: Product): void {
    const ref = this.modal.open(ProductDetailComponent);
    ref.componentInstance.product = product;
    ref.componentInstance.changed.subscribe(() => this.reload());
    ref.result.then(() => undefined, () => undefined);
  }

  create(): void {
    const ref = this.modal.open(ProductFormComponent, { size: 'lg' });
    ref.componentInstance.saved.subscribe(() => this.reload());
    ref.result.then(() => undefined, () => undefined);
  }

  reload(): void {
    this.service.list().subscribe(products => {
      this.loading = false;
      this.products$.next(products);
    });
  }
}
