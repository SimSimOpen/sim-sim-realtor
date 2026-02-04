import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from './account/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideToastr({
      closeButton: true,
      timeOut: 1500, // 1.5 seconds
      progressBar: true,
      positionClass: 'toast-top-right', // or 'toast-center-center'
      toastClass: 'ngx-toastr custom-toast',
    }),
  ],
};
