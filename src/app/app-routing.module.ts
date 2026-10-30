import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { ShellComponent } from './features/shell/shell.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'products', loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule) },
      { path: 'stock', loadChildren: () => import('./features/stock/stock.module').then(m => m.StockModule) },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule) }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
