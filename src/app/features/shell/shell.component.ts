import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { DbService } from '../../core/db.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  user$ = this.auth.user$;

  readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/products', label: 'Products' },
    { path: '/stock', label: 'Stock' },
    { path: '/orders', label: 'Orders' }
  ];

  constructor(private auth: AuthService, private db: DbService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  resetDemo(): void {
    this.db.reset();
    location.reload();
  }
}
