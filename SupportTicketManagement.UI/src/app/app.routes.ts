import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/auth/sign-in').then(m => m.SignIn)
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets-page/tickets-page').then(m => m.TicketsPage)
  },
  { path: '**', redirectTo: '' }
];
