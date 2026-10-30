import { Observable, defer, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Runs a synchronous database call lazily and delivers the result after a short delay,
 * so the UI behaves as it would against a remote API. Thrown errors become observable errors.
 */
export function respond<T>(work: () => T): Observable<T> {
  return defer(() => of(work())).pipe(delay(120));
}
