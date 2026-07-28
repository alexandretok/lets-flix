import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-browse',
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss',
})
export class BrowseComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  catalog: any[] = [];
  sortedCatalog: any[] = [];
  sortBy = 'recent';
  filterType = 'all';

  sortOptions = [
    { label: 'Recently Active', value: 'recent' },
    { label: 'Title (A-Z)', value: 'title_asc' },
    { label: 'Title (Z-A)', value: 'title_desc' },
    { label: 'Date Added', value: 'added' },
  ];

  filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'movie' },
    { label: 'Series', value: 'series' },
  ];

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.api.getCatalog().subscribe({
      next: (res) => {
        this.catalog = res.catalog;
        this.applyFilterAndSort();
        this.cdr.markForCheck();
      }
    });
  }

  applyFilterAndSort(): void {
    let items = [...this.catalog];

    if (this.filterType !== 'all') {
      items = items.filter(item => item.type === this.filterType);
    }

    switch (this.sortBy) {
      case 'recent':
        items.sort((a, b) => {
          const aDate = a.last_watched_at || a.added_at || '';
          const bDate = b.last_watched_at || b.added_at || '';
          return bDate.localeCompare(aDate);
        });
        break;
      case 'title_asc':
        items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'added':
        items.sort((a, b) => (b.added_at || '').localeCompare(a.added_at || ''));
        break;
    }
    this.sortedCatalog = items;
  }

  onSortChange(): void {
    this.applyFilterAndSort();
  }

  onFilterChange(): void {
    this.applyFilterAndSort();
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
