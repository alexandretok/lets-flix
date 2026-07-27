import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/browse', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'setup-password', loadComponent: () => import('./pages/setup-password/setup-password.component').then(m => m.SetupPasswordComponent) },
  { path: 'browse', loadComponent: () => import('./pages/browse/browse.component').then(m => m.BrowseComponent) },
  { path: 'browse/:id', loadComponent: () => import('./pages/content-details/content-details.component').then(m => m.ContentDetailsComponent) },
  { path: 'search', loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent) },
  { path: 'watch/:id', loadComponent: () => import('./pages/watch/watch.component').then(m => m.WatchComponent) },
  { path: 'users', loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '/browse' }
];
