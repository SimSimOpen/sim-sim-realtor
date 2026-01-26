import { Routes } from '@angular/router';
import { Auth } from './pages/auth/auth';

export const routes: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/auth/auth').then((m) => m.Auth),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/agent-main/agent-main').then((m) => m.AgentMain),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/properties/properties').then((m) => m.Properties),
      },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agents/agents').then((m) => m.Agents),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((m) => m.Users),
      },
    ],
  },
];
