import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EnvironmentTs } from '../../environments/environment';
import { I18nService } from './i18n.service';

/** Tells our backend the UI language, so location names come back in it. */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(EnvironmentTs.URL)) {
    return next(req);
  }
  const lang = inject(I18nService).lang();
  return next(req.clone({ setHeaders: { 'Accept-Language': lang } }));
};
