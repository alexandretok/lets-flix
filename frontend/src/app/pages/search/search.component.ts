import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { EpisodeSelectorComponent, EpisodeSaveResult } from '../../components/episode-selector/episode-selector.component';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, InputText, Button, Toast, EpisodeSelectorComponent],
  providers: [MessageService],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  query = '';
  results: any[] = [];
  loading = false;
  showSeriesDialog = false;
  selectedSeries: any = null;
  previewImageUrl: string | null = null;

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

  performSearch(): void {
    if (!this.query || this.query.trim().length < 2) {
      this.results = [];
      return;
    }
    this.loading = true;
    this.api.searchTMDB(this.query.trim()).subscribe({
      next: (res) => {
        this.results = res.results;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
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
        this.messageService.add({ severity: 'success', summary: 'Added', detail: `${item.title} added to catalog` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to add' });
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
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Episodes: ${parts.join(', ')}` });
  }
}
