import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('Auth Guards', () => {
  let store: InstanceType<typeof AuthStore>;
  let router: Router;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('authGuard', () => {
    it('should allow access when authenticated and password changed', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /login when not authenticated', () => {
      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to /setup-password when password change required', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: true });

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/setup-password']);
    });
  });

  describe('guestGuard', () => {
    it('should allow access when not authenticated', () => {
      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /browse when already authenticated', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/browse']);
    });

    it('should allow access when authenticated but password change required', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: true });

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });
  });

  describe('adminGuard', () => {
    it('should allow access for admins', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /browse for non-admin users', () => {
      store.loginSuccess('token', { id: 2, username: 'user', role: 'user', requires_password_change: false });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/browse']);
    });
  });
});
