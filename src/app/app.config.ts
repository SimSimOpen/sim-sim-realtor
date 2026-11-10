import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';

import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from './account/auth.interceptor';
import { languageInterceptor } from './shared/i18n/language.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The first navigation is started by App once a client-app handoff (if any) is resolved, so
    // the login page is never rendered for a session that is about to be taken over.
    provideRouter(routes, withDisabledInitialNavigation()),
    provideHttpClient(withInterceptors([authInterceptor, languageInterceptor])),
    provideToastr({
      closeButton: true,
      timeOut: 1500, // 1.5 seconds
      progressBar: true,
      positionClass: 'toast-top-right', // or 'toast-center-center'
      toastClass: 'ngx-toastr custom-toast',
    }),
  ],
};
