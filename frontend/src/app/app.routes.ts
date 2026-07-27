import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/browse', pathMatch: 'full' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'setup-password', loadComponent: () => import('./pages/setup-password/setup-password.component').then(m => m.SetupPasswordComponent) },
  { path: 'browse', canActivate: [authGuard], loadComponent: () => import('./pages/browse/browse.component').then(m => m.BrowseComponent) },
  { path: 'browse/:id', canActivate: [authGuard], loadComponent: () => import('./pages/content-details/content-details.component').then(m => m.ContentDetailsComponent) },
  { path: 'search', canActivate: [authGuard], loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent) },
  { path: 'watch/:id', canActivate: [authGuard], loadComponent: () => import('./pages/watch/watch.component').then(m => m.WatchComponent) },
  { path: 'users', canActivate: [authGuard, adminGuard], loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
  { path: 'settings', canActivate: [authGuard], loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '/browse' }
];
