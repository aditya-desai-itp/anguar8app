import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { OrderDetailComponent } from './order-detail.component';
import { OrderFormComponent } from './order-form.component';
import { OrdersComponent } from './orders.component';

@NgModule({
  declarations: [OrdersComponent, OrderDetailComponent, OrderFormComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: OrdersComponent }])],
  entryComponents: [OrderDetailComponent, OrderFormComponent]
})
export class OrdersModule {}
