import { Routes } from '@angular/router';
import { AppShellComponent } from '../core/layout/app-shell/app-shell.component';
import { authGuard } from '../core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadChildren: () => import('../features/auth/auth.routes').then((m) => m.authRoutes) },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'shadowing',
        loadChildren: () => import('../features/shadowing/shadowing.routes').then((m) => m.shadowingRoutes),
      },
    ],
  },
];
