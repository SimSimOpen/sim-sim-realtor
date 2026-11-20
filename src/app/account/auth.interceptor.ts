import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const EXCLUDED_URLS = [
  '/api/auth/v1/authenticate',
  '/api/auth/v1/register/agent',
  '/api/auth/v1/refresh',
];

/**
 * Adds the access token, refreshing it first when it is about to expire. A 401 that still slips
 * through (clock skew, a token the server dropped) gets one refresh and one retry.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (EXCLUDED_URLS.some((url) => req.url.includes(url))) {
    return next(req);
  }
  const auth = inject(AuthService);
  // Requests that already carry a token (the phone upload page's QR token) are left alone.
  if (req.headers.has('Authorization')) {
    return next(req);
  }
  const withToken = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return auth.validToken().pipe(
    switchMap((token) =>
      next(withToken(token)).pipe(
        catchError((err: unknown) => {
          if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !token) {
            return throwError(() => err);
          }
          return auth
            .refresh()
            .pipe(
              switchMap((fresh) =>
                fresh && fresh !== token ? next(withToken(fresh)) : throwError(() => err),
              ),
            );
        }),
      ),
    ),
  );
};
