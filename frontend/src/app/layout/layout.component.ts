import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthStore } from '../stores/auth.store';
import { ApiService } from '../services/api.service';
import { SSEService } from '../services/sse.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, Button, ProgressBarModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private sseService = inject(SSEService);
  private cdr = inject(ChangeDetectorRef);

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
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
