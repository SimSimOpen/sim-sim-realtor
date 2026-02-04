import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    const loginPath = router.parseUrl('/');
    authService.clearStorage();
    return new RedirectCommand(loginPath);
  }

  return authService.checkTokenValidity().pipe(
    map(() => {
      return true;
    }),
    catchError(() => {
      const loginPath = router.parseUrl('/');
      authService.clearStorage();
      return of(new RedirectCommand(loginPath));
    })
  );
};

export const isAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    const homePath = router.parseUrl('/');
    return new RedirectCommand(homePath);
  }
  authService.checkTokenValidity().pipe(
    map(() => {
      return true;
    }),
    catchError(() => {
      const loginPath = router.parseUrl('/');
      authService.clearStorage();
      return of(new RedirectCommand(loginPath));
    })
  );
  return authService
    .isAdmin()
    .pipe(
      map((isAdmin) =>
        isAdmin ? true : new RedirectCommand(router.parseUrl('/'))
      )
    );
};
