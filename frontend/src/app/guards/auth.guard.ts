import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authStore.requiresPasswordChange()) {
    router.navigate(['/setup-password']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated() && !authStore.requiresPasswordChange()) {
    router.navigate(['/browse']);
    return false;
  }

  return true;
};

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAdmin()) {
    router.navigate(['/browse']);
    return false;
  }

  return true;
};
