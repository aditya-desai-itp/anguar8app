import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';

import { GridComponent } from './grid/grid.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ToastComponent } from './toast/toast.component';

@NgModule({
  declarations: [GridComponent, ProductDetailComponent, ToastComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, AgGridModule.withComponents([])],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule, GridComponent, ProductDetailComponent, ToastComponent],
  // Opened through NgbModal rather than a template, so Angular 8 needs them listed here.
  entryComponents: [ProductDetailComponent]
})
export class SharedModule {}
