import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { LayoutComponent } from '../../layout/layout.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-browse',
  imports: [CommonModule, RouterLink, Tag, Button, LayoutComponent],
  template: `
    <app-layout>
      <div class="browse-header">
        <h1>My Catalog</h1>
        <p-button label="Add Content" icon="pi pi-plus" routerLink="/search" severity="danger" />
      </div>
      @if (catalog.length === 0) {
        <div class="empty-state">
          <i class="pi pi-video" style="font-size: 4rem; color: #555;"></i>
          <h3>Your catalog is empty</h3>
          <p>Search for movies and series to add them to your catalog.</p>
          <p-button label="Search Content" icon="pi pi-search" routerLink="/search" severity="danger" />
        </div>
      } @else {
        <div class="catalog-grid">
          @for (item of catalog; track item.id) {
            <div class="media-card" (click)="openDetails(item.id)">
              <div class="poster">
                @if (item.poster_url) {
                  <img [src]="item.poster_url" [alt]="item.title" />
                } @else {
                  <div class="placeholder-poster"><i class="pi pi-image"></i></div>
                }
                <p-tag [value]="item.status" [severity]="getStatusSeverity(item.status)" class="status-badge" />
              </div>
              <div class="card-info">
                <h4>{{ item.title }}</h4>
                <span class="type-badge">{{ item.type }}</span>
              </div>
            </div>
          }
        </div>
      }
    </app-layout>
  `,
  styles: [`
    .browse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .browse-header h1 { color: #e0e0e0; margin: 0; }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #a0a0a0;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.5rem;
    }
    .media-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .media-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    .poster {
      position: relative;
      aspect-ratio: 2/3;
      overflow: hidden;
    }
    .poster img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder-poster {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      font-size: 2rem;
      color: #555;
    }
    .status-badge { position: absolute; top: 8px; right: 8px; }
    .card-info { padding: 0.75rem; }
    .card-info h4 { margin: 0 0 0.25rem; color: #e0e0e0; font-size: 0.9rem; }
    .type-badge {
      font-size: 0.75rem;
      color: #a0a0a0;
      text-transform: capitalize;
    }
  `]
})
export class BrowseComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  catalog: any[] = [];

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.api.getCatalog().subscribe({
      next: (res) => { this.catalog = res.catalog; }
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
