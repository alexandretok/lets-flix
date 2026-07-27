import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Router } from '@angular/router';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
  requires_password_change: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('letsflix_token') : null,
  user: typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('letsflix_user') || 'null') : null,
  isAuthenticated: typeof localStorage !== 'undefined' ? !!localStorage.getItem('letsflix_token') : false,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    isAdmin: computed(() => state.user()?.role === 'admin'),
    requiresPasswordChange: computed(() => state.user()?.requires_password_change ?? false),
  })),
  withMethods((store) => ({
    setLoading(loading: boolean) {
      patchState(store, { loading, error: null });
    },
    loginSuccess(token: string, user: AuthUser) {
      localStorage.setItem('letsflix_token', token);
      localStorage.setItem('letsflix_user', JSON.stringify(user));
      patchState(store, { token, user, isAuthenticated: true, loading: false, error: null });
    },
    loginFailure(error: string) {
      patchState(store, { loading: false, error });
    },
    passwordChanged(token: string) {
      const user = store.user();
      if (user) {
        const updatedUser = { ...user, requires_password_change: false };
        localStorage.setItem('letsflix_token', token);
        localStorage.setItem('letsflix_user', JSON.stringify(updatedUser));
        patchState(store, { token, user: updatedUser });
      }
    },
    logout() {
      localStorage.removeItem('letsflix_token');
      localStorage.removeItem('letsflix_user');
      patchState(store, { token: null, user: null, isAuthenticated: false });
    },
  }))
);
