import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthStore } from '../stores/auth.store';
import { ApiService } from '../services/api.service';
import { SSEService } from '../services/sse.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, Button, ProgressBarModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private sseService = inject(SSEService);
  private cdr = inject(ChangeDetectorRef);
  private sseSub?: Subscription;

  storagePercent = 0;
  storageWarning = false;
  storageFree = '';

  ngOnInit(): void {
    this.sseService.connect();
    this.loadStorage();

    this.sseSub = this.sseService.downloadProgress$.subscribe((event) => {
      if (event.status === 'downloaded') {
        this.loadStorage();
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.sseService.disconnect();
  }

  loadStorage(): void {
    this.api.getStorageStatus().subscribe({
      next: (status: any) => {
        this.storagePercent = status.percentage;
        this.storageWarning = status.warning;
        this.storageFree = this.formatBytes(status.free);
        this.cdr.markForCheck();
      }
    });
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
