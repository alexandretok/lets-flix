import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
  });

  describe('loginSuccess', () => {
    it('should set authenticated state', () => {
      store.loginSuccess('token123', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });

      expect(store.isAuthenticated()).toBe(true);
      expect(store.token()).toBe('token123');
      expect(store.user()?.username).toBe('admin');
      expect(store.isAdmin()).toBe(true);
    });

    it('should persist to localStorage', () => {
      store.loginSuccess('token123', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });

      expect(localStorage.getItem('letsflix_token')).toBe('token123');
      expect(JSON.parse(localStorage.getItem('letsflix_user')!).username).toBe('admin');
    });
  });

  describe('loginFailure', () => {
    it('should set error and clear loading', () => {
      store.setLoading(true);
      store.loginFailure('Invalid credentials');

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear authenticated state', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });
      store.logout();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.token()).toBeNull();
      expect(store.user()).toBeNull();
    });

    it('should remove from localStorage', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: false });
      store.logout();

      expect(localStorage.getItem('letsflix_token')).toBeNull();
      expect(localStorage.getItem('letsflix_user')).toBeNull();
    });
  });

  describe('passwordChanged', () => {
    it('should update token and clear requires_password_change', () => {
      store.loginSuccess('old_token', { id: 1, username: 'admin', role: 'admin', requires_password_change: true });

      expect(store.requiresPasswordChange()).toBe(true);

      store.passwordChanged('new_token');

      expect(store.token()).toBe('new_token');
      expect(store.requiresPasswordChange()).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('isAdmin should be false for regular users', () => {
      store.loginSuccess('token', { id: 2, username: 'user1', role: 'user', requires_password_change: false });
      expect(store.isAdmin()).toBe(false);
    });

    it('requiresPasswordChange should reflect user state', () => {
      store.loginSuccess('token', { id: 1, username: 'admin', role: 'admin', requires_password_change: true });
      expect(store.requiresPasswordChange()).toBe(true);
    });
  });
});
