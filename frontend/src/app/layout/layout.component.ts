import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Sidebar } from 'primeng/sidebar';
import { Button } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthStore } from '../stores/auth.store';
import { ApiService } from '../services/api.service';
import { SSEService } from '../services/sse.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Button, ProgressBarModule],
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2 class="logo">LetsFlix</h2>
        </div>
        <ul class="nav-links">
          <li><a routerLink="/browse" routerLinkActive="active"><i class="pi pi-th-large"></i> Browse</a></li>
          <li><a routerLink="/search" routerLinkActive="active"><i class="pi pi-search"></i> Search</a></li>
          <li><a routerLink="/settings" routerLinkActive="active"><i class="pi pi-cog"></i> Settings</a></li>
          @if (authStore.isAdmin()) {
            <li><a routerLink="/users" routerLinkActive="active"><i class="pi pi-users"></i> Users</a></li>
          }
        </ul>
        <div class="sidebar-footer">
          <div class="storage-section" [class.warning]="storageWarning">
            <span class="storage-label">Storage</span>
            <p-progressbar [value]="storagePercent" [showValue]="true" [style]="{'height': '10px'}" />
          </div>
          <div class="user-section">
            <span class="username"><i class="pi pi-user"></i> {{ authStore.user()?.username }}</span>
            <p-button icon="pi pi-sign-out" [text]="true" severity="secondary" (onClick)="logout()" size="small" />
          </div>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 240px;
      background: #16213e;
      border-right: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
    }
    .sidebar-header { margin-bottom: 2rem; }
    .logo { color: #e94560; margin: 0; font-size: 1.8rem; }
    .nav-links { list-style: none; padding: 0; margin: 0; flex: 1; }
    .nav-links li { margin-bottom: 0.5rem; }
    .nav-links a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: #a0a0a0;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-links a:hover { background: rgba(255,255,255,0.05); color: #e0e0e0; }
    .nav-links a.active { background: rgba(233,69,96,0.15); color: #e94560; }
    .sidebar-footer { margin-top: auto; }
    .storage-section {
      padding: 0.75rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      margin-bottom: 1rem;
    }
    .storage-section.warning { background: rgba(255,0,0,0.1); }
    .storage-label { font-size: 0.8rem; color: #a0a0a0; display: block; margin-bottom: 0.5rem; }
    .user-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
    }
    .username { color: #e0e0e0; font-size: 0.9rem; }
    .main-content { flex: 1; margin-left: 240px; padding: 2rem; min-height: 100vh; }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private sseService = inject(SSEService);

  storagePercent = 0;
  storageWarning = false;

  ngOnInit(): void {
    this.sseService.connect();
    this.loadStorage();
  }

  ngOnDestroy(): void {
    this.sseService.disconnect();
  }

  loadStorage(): void {
    this.api.getStorageStatus().subscribe({
      next: (status: any) => {
        this.storagePercent = status.percentage;
        this.storageWarning = status.warning;
      }
    });
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
