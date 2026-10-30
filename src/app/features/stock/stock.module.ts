import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { StockComponent } from './stock.component';

@NgModule({
  declarations: [StockComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: StockComponent }])]
})
export class StockModule {}
