import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { User } from '../models/models';
import { DbService } from './db.service';
import { respond } from './respond';

const SESSION_KEY = 'forge-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(this.restore());
  readonly user$ = this.userSubject.asObservable();

  constructor(private db: DbService) {}

  get user(): User | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.user !== null;
  }

  get isManager(): boolean {
    return this.user !== null && this.user.role === 'Manager';
  }

  login(username: string, password: string): Observable<User> {
    return respond(() => {
      const user = this.db.queryOne<User>(
        'SELECT username, name, role FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      if (!user) {
        throw new Error('Username or password is incorrect.');
      }
      return user;
    }).pipe(
      tap(user => {
        this.userSubject.next(user);
        this.save(user);
      })
    );
  }

  logout(): void {
    this.userSubject.next(null);
    this.save(null);
  }

  /** Called by services before any write, so the rule holds even if a screen forgets to hide a button. */
  requireManager(): void {
    if (!this.isManager) {
      throw new Error('Only managers can make this change.');
    }
  }

  private save(user: User | null): void {
    try {
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      // session storage unavailable; user stays signed in for this page load only
    }
  }

  private restore(): User | null {
    try {
      const text = sessionStorage.getItem(SESSION_KEY);
      return text ? (JSON.parse(text) as User) : null;
    } catch (e) {
      return null;
    }
  }
}
