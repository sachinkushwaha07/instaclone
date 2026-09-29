import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

/** Keeps a logged-in user from seeing the login/signup screens again. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  router.navigate(['/']);
  return false;
};