import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Product, StockMovement } from '../../models/models';
import { ProductService } from '../../services/product.service';
import { StockService } from '../../services/stock.service';
import { GridColumn } from '../../shared/grid/grid.component';
import { stockBar, stockPill } from '../../shared/pills';
import { ProductDetailComponent } from '../../shared/product-detail/product-detail.component';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html'
})
export class StockComponent implements OnInit {
  readonly columns: GridColumn[] = [
    { key: 'sku', header: 'SKU', mono: true },
    { key: 'name', header: 'Product' },
    { key: 'bin', header: 'Bin', mono: true },
    { key: 'level', header: 'Level', type: 'bar', bar: stockBar, sortValue: p => p.stock / p.maxLevel },
    { key: 'stock', header: 'On hand', type: 'number' },
    { key: 'minLevel', header: 'Reorder at', type: 'number' },
    { key: 'status', header: 'Status', type: 'pill', pill: stockPill, sortValue: p => p.stock / p.minLevel }
  ];

  products: Product[] = [];
  rows: Product[] = [];
  movements: StockMovement[] = [];
  onlyLow = false;
  loading = true;

  constructor(private productService: ProductService, private stockService: StockService, private modal: NgbModal) {}

  ngOnInit(): void {
    this.reload();
  }

  setOnlyLow(value: boolean): void {
    this.onlyLow = value;
    this.applyFilter();
  }

  open(product: Product): void {
    const ref = this.modal.open(ProductDetailComponent);
    ref.componentInstance.product = product;
    ref.componentInstance.changed.subscribe(() => this.reload());
    ref.result.then(() => undefined, () => undefined);
  }

  reload(): void {
    this.productService.list().subscribe(p => {
      this.loading = false;
      this.products = p;
      this.applyFilter();
    });
    this.stockService.movements(10).subscribe(m => (this.movements = m));
  }

  private applyFilter(): void {
    this.rows = this.onlyLow ? this.products.filter(p => p.stock < p.minLevel) : this.products;
  }
}
