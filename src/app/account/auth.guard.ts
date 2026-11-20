import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Keeps anonymous visitors on the login screen. A valid token costs no request; an expired one is
 * renewed with the refresh token first, and only a session that cannot be renewed is dropped.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.hasSession().pipe(
    map((ok) => {
      if (ok) return true;
      authService.clearStorage();
      return new RedirectCommand(router.parseUrl('/'));
    }),
  );
};

/** The login page: someone who is still signed in goes straight to the dashboard. */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService
    .hasSession()
    .pipe(map((ok) => (ok ? new RedirectCommand(router.parseUrl('/dashboard')) : true)));
};

/**
 * Admin-only pages (Agents). An agent who deep-links here stays inside the app and lands on
 * the dashboard rather than being signed out, because their token is perfectly valid.
 */
export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.hasSession().pipe(
    map((ok) => {
      if (!ok) {
        authService.clearStorage();
        return new RedirectCommand(router.parseUrl('/'));
      }
      return authService.isAdminRole() ? true : new RedirectCommand(router.parseUrl('/dashboard'));
    }),
  );
};
