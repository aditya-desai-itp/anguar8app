import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { DbService } from './db.service';

describe('AuthService', () => {
  let service: AuthService;
  let db: { queryOne: jasmine.Spy };

  beforeEach(() => {
    sessionStorage.clear();
    db = { queryOne: jasmine.createSpy('queryOne') };
    TestBed.configureTestingModule({ providers: [{ provide: DbService, useValue: db }] });
    service = TestBed.get(AuthService);
  });

  it('starts signed out', () => {
    expect(service.isLoggedIn).toBe(false);
  });

  it('signs in with matching credentials', done => {
    db.queryOne.and.returnValue({ username: 'planner', name: 'Planner', role: 'Manager' });
    service.login('planner', 'factory123').subscribe(user => {
      expect(user.role).toBe('Manager');
      expect(service.isManager).toBe(true);
      done();
    });
  });

  it('rejects bad credentials', done => {
    db.queryOne.and.returnValue(null);
    service.login('x', 'y').subscribe(
      () => done.fail('should not sign in'),
      err => {
        expect(err.message).toContain('incorrect');
        expect(service.isLoggedIn).toBe(false);
        done();
      }
    );
  });

  it('blocks writes for viewers', done => {
    db.queryOne.and.returnValue({ username: 'viewer', name: 'Viewer', role: 'Viewer' });
    service.login('viewer', 'viewer123').subscribe(() => {
      expect(() => service.requireManager()).toThrowError('Only managers can make this change.');
      done();
    });
  });
});
