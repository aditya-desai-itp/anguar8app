import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  text: string;
  kind: 'info' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly subject = new Subject<Toast>();
  readonly toasts$ = this.subject.asObservable();

  show(text: string): void {
    this.subject.next({ text, kind: 'info' });
  }

  error(text: string): void {
    this.subject.next({ text, kind: 'error' });
  }
}
