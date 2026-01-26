import { Routes } from '@angular/router';
import { Auth } from './pages/auth/auth';

export const routes: Routes = [

    {
        path: '',
        component: Auth,
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/auth/auth').then((m)=>m.Auth),
          },
        ],
      },

];
