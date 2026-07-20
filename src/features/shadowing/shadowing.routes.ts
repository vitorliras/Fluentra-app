import { Routes } from '@angular/router';

export const shadowingRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/shadowing-session.page').then((m) => m.ShadowingSessionPage) },
];
