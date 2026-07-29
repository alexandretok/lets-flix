import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { EpisodeSelectorComponent, EpisodeSaveResult } from '../../components/episode-selector/episode-selector.component';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, EpisodeSelectorComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  query = '';
  results: any[] = [];
  loading = false;
  showSeriesDialog = false;
  selectedSeries: any = null;
  previewImageUrl: string | null = null;

  currentPage = 1;
  totalPages = 0;
  totalResults = 0;
  hasSearched = false;
  lastSearchQuery = '';

  episodeSelectorTmdbId = 0;
  episodeSelectorMediaId: number | null = null;
  episodeSelectorExisting: any[] = [];

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams['q'];
    if (q) {
      this.query = q;
      this.performSearch();
    }
  }

  performSearch(page = 1): void {
    if (!this.query || this.query.trim().length < 2) {
      this.results = [];
      return;
    }
    this.loading = true;
    this.results = [];
    this.totalResults = 0;
    this.hasSearched = true;
    this.lastSearchQuery = this.query.trim();
    this.cdr.markForCheck();
    this.api.searchTMDB(this.query.trim(), page).subscribe({
      next: (res) => {
        this.results = res.results;
        this.currentPage = res.page;
        this.totalPages = res.total_pages;
        this.totalResults = res.total_results;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.performSearch(page);
    }
  }

  openImagePreview(url: string, event: Event): void {
    event.stopPropagation();
    this.previewImageUrl = url;
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
  }

  addMovie(item: any): void {
    this.api.addToCatalog(item.id, 'movie').subscribe({
      next: () => {
        this.notify.success(`${item.title} added to catalog`);
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to add');
      }
    });
  }

  openSeriesDialog(item: any): void {
    this.selectedSeries = item;
    this.episodeSelectorTmdbId = item.id;
    this.episodeSelectorMediaId = null;
    this.episodeSelectorExisting = [];

    this.api.getMediaByTmdbId(item.id).subscribe({
      next: (res) => {
        this.episodeSelectorMediaId = res.media.id;
        this.episodeSelectorExisting = res.episodes;
        this.showSeriesDialog = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showSeriesDialog = true;
        this.cdr.detectChanges();
      }
    });
  }

  onEpisodesSaved(result: EpisodeSaveResult): void {
    const parts: string[] = [];
    if (result.added > 0) parts.push(`${result.added} added`);
    if (result.removed > 0) parts.push(`${result.removed} removed`);
    this.notify.success(`Episodes: ${parts.join(', ')}`);
  }
}
