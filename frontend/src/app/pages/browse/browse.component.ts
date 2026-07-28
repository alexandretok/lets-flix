import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-browse',
  imports: [CommonModule, RouterLink, Tag, Button],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss',
})
export class BrowseComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  catalog: any[] = [];

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.api.getCatalog().subscribe({
      next: (res) => { this.catalog = res.catalog; this.cdr.markForCheck(); }
    });
  }

  openDetails(id: number): void {
    this.router.navigate(['/browse', id]);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      downloaded: 'success',
      downloading: 'info',
      pending: 'warn',
      searching: 'info',
      not_found: 'danger',
    };
    return map[status] || 'secondary';
  }
}
