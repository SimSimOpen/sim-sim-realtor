import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const excludedUrls = [
    '/api/auth/v1/authenticate',
    '/api/auth/v1/register/agent',
    '/auth/refresh',
  ];

  if (excludedUrls.some((url) => req.url.includes(url))) {
    return next(req);
  }
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    req = cloned;
  }
  return next(req);
};
