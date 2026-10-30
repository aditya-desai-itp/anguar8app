import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ProductFormComponent } from './product-form.component';
import { ProductsComponent } from './products.component';

@NgModule({
  declarations: [ProductsComponent, ProductFormComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: ProductsComponent }])],
  entryComponents: [ProductFormComponent]
})
export class ProductsModule {}
