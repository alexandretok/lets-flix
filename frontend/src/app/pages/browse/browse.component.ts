import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-browse',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
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

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'pending download',
      downloading: 'downloading',
      downloaded: 'downloaded',
      searching: 'searching',
      not_found: 'not found',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      downloaded: 'tag-success',
      downloading: 'tag-info',
      pending: 'tag-warn',
      searching: 'tag-info',
      not_found: 'tag-danger',
    };
    return map[status] || 'tag-secondary';
  }
}
