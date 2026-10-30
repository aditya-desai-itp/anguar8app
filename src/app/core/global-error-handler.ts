import { ErrorHandler, Injectable, Injector } from '@angular/core';

import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Injector is used because ErrorHandler is created before most services.
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    console.error(error);
    this.injector.get(ToastService).error('Something went wrong. Please try again.');
  }
}
