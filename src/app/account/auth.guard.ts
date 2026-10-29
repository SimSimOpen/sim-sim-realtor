import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Keeps anonymous visitors on the login screen. The check is local (token presence plus its `exp`
 * claim) so guarding a route costs no extra request; an expired token is dropped with the session.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isTokenExpired()) {
    authService.clearStorage();
    return new RedirectCommand(router.parseUrl('/'));
  }
  return true;
};

/**
 * Admin-only pages (Agents, Users). An agent who deep-links here stays inside the app and lands on
 * the dashboard rather than being signed out, because their token is perfectly valid.
 */
export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isTokenExpired()) {
    authService.clearStorage();
    return new RedirectCommand(router.parseUrl('/'));
  }
  return authService.isAdminRole() ? true : new RedirectCommand(router.parseUrl('/dashboard'));
};
