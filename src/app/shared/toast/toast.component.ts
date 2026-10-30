import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Toast, ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-host" aria-live="polite">
      <ngb-toast
        *ngIf="toast"
        [autohide]="false"
        [class.bg-danger]="toast.kind === 'error'"
        [class.text-light]="toast.kind === 'error'"
        (hide)="toast = null"
      >
        {{ toast.text }}
      </ngb-toast>
    </div>`
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: Toast | null = null;
  private timer: any;
  private readonly destroy$ = new Subject<void>();

  constructor(private service: ToastService) {}

  ngOnInit(): void {
    this.service.toasts$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.toast = t;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => (this.toast = null), 3000);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
