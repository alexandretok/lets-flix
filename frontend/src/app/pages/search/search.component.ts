import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { Checkbox } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { LayoutComponent } from '../../layout/layout.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, InputText, Button, Dialog, Toast, Checkbox, LayoutComponent],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="search-header">
        <h1>Search</h1>
      </div>
      <div class="search-input-wrapper">
        <div class="search-bar">
          <input pInputText [(ngModel)]="query" placeholder="Search movies and series..." class="search-input" (keydown.enter)="performSearch()" />
          <p-button icon="pi pi-search" severity="danger" (onClick)="performSearch()" [loading]="loading" />
        </div>
      </div>

      @if (loading) {
        <div class="loading"><i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i></div>
      }

      <div class="results-grid">
        @for (item of results; track item.id) {
          <div class="result-card">
            <div class="poster">
              @if (item.poster_url) {
                <img [src]="item.poster_url" [alt]="item.title" />
              } @else {
                <div class="placeholder-poster"><i class="pi pi-image"></i></div>
              }
            </div>
            <div class="result-info">
              <h4>{{ item.title }}</h4>
              <span class="meta">{{ item.media_type === 'tv' ? 'Series' : 'Movie' }} · {{ item.release_date | slice:0:4 }}</span>
              <p class="overview">{{ item.overview | slice:0:100 }}{{ item.overview?.length > 100 ? '...' : '' }}</p>
              @if (item.media_type === 'tv') {
                <p-button label="Select Episodes" icon="pi pi-list" size="small" severity="danger" (onClick)="openSeriesDialog(item)" />
              } @else {
                <p-button label="Add to Catalog" icon="pi pi-plus" size="small" severity="danger" (onClick)="addMovie(item)" />
              }
            </div>
          </div>
        }
      </div>

      <p-dialog header="Select Episodes" [(visible)]="showSeriesDialog" [modal]="true" [style]="{width: '500px'}" [draggable]="false">
        @if (selectedSeries) {
          <div class="episodes-selector">
            @for (season of seasons; track season.season_number) {
              <div class="season-block">
                <div class="season-header">
                  <p-checkbox [(ngModel)]="season.selected" [binary]="true" (onChange)="toggleSeason(season)" />
                  <span>{{ season.name }} ({{ season.episode_count }} episodes)</span>
                </div>
                @if (season.episodes) {
                  <div class="episodes-list">
                    @for (ep of season.episodes; track ep.episode_number) {
                      <div class="episode-item" (click)="onEpisodeClick($event, season, ep)">
                        <p-checkbox [ngModel]="ep.selected" [binary]="true" class="no-pointer" />
                        <span>E{{ ep.episode_number }} - {{ ep.name }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
          <div class="dialog-footer">
            <p-button label="Add Selected" icon="pi pi-plus" severity="danger" (onClick)="addSelectedEpisodes()" [disabled]="!hasSelectedEpisodes()" />
          </div>
        }
      </p-dialog>
    </app-layout>
  `,
  styles: [`
    .search-header { margin-bottom: 1.5rem; }
    .search-header h1 { color: #e0e0e0; margin: 0; }
    .search-input-wrapper { margin-bottom: 2rem; }
    .search-bar { display: flex; gap: 0.5rem; align-items: stretch; }
    .search-input { flex: 1; padding: 0.75rem 1rem; font-size: 1.1rem; }
    .w-full { width: 100%; }
    .loading { text-align: center; padding: 2rem; color: #a0a0a0; }
    .results-grid { display: flex; flex-direction: column; gap: 1rem; }
    .result-card {
      display: flex;
      gap: 1rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      overflow: hidden;
      padding: 1rem;
    }
    .result-card .poster { width: 100px; flex-shrink: 0; }
    .result-card .poster img { width: 100%; border-radius: 8px; }
    .placeholder-poster {
      width: 100%;
      aspect-ratio: 2/3;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      border-radius: 8px;
      color: #555;
    }
    .result-info { flex: 1; }
    .result-info h4 { margin: 0 0 0.25rem; color: #e0e0e0; }
    .meta { font-size: 0.85rem; color: #a0a0a0; }
    .overview { font-size: 0.85rem; color: #888; margin: 0.5rem 0; }
    .episodes-selector { max-height: 50vh; overflow-y: auto; }
    .season-block { margin-bottom: 1rem; }
    .season-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
    }
    .episodes-list { padding-left: 1.5rem; user-select: none; }
    .episode-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      color: #ccc;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: 4px;
    }
    .episode-item:hover { background: rgba(255,255,255,0.05); }
    .no-pointer { pointer-events: none; }
    .dialog-footer {
      margin-top: 1rem;
      text-align: right;
      position: sticky;
      bottom: 0;
      background: var(--p-dialog-background, #1e1e2e);
      padding: 0.75rem 0 0;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
  `]
})
export class SearchComponent {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  query = '';
  results: any[] = [];
  loading = false;
  showSeriesDialog = false;
  selectedSeries: any = null;
  seasons: any[] = [];
  private lastClickedEpisode: { season: any; index: number } | null = null;

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
    this.seasons = [];
    this.showSeriesDialog = true;

    this.api.getSeriesSeasons(item.id).subscribe({
      next: (res) => {
        this.seasons = res.seasons.map((s: any) => ({ ...s, selected: false, episodes: null }));
        for (const season of this.seasons) {
          this.api.getSeasonEpisodes(item.id, season.season_number).subscribe({
            next: (epRes) => {
              season.episodes = epRes.episodes.map((ep: any) => ({ ...ep, selected: false }));
            }
          });
        }
      }
    });
  }

  toggleSeason(season: any): void {
    if (season.episodes) {
      for (const ep of season.episodes) {
        ep.selected = season.selected;
      }
    }
  }

  onEpisodeClick(event: MouseEvent, season: any, ep: any): void {
    if (event.shiftKey && this.lastClickedEpisode && this.lastClickedEpisode.season === season) {
      const episodes = season.episodes;
      const currentIndex = episodes.indexOf(ep);
      const lastIndex = this.lastClickedEpisode.index;
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const value = !ep.selected;
      for (let i = start; i <= end; i++) {
        episodes[i].selected = value;
      }
      this.onEpisodeToggle(season);
    } else {
      ep.selected = !ep.selected;
      this.onEpisodeToggle(season);
    }
    this.lastClickedEpisode = { season, index: season.episodes.indexOf(ep) };
  }

  onEpisodeToggle(season: any): void {
    if (season.episodes) {
      season.selected = season.episodes.every((ep: any) => ep.selected);
    }
  }

  hasSelectedEpisodes(): boolean {
    return this.seasons.some(s => s.episodes?.some((ep: any) => ep.selected));
  }

  addSelectedEpisodes(): void {
    const selected: any[] = [];
    for (const season of this.seasons) {
      if (season.episodes) {
        for (const ep of season.episodes) {
          if (ep.selected) {
            selected.push({ season: season.season_number, episode: ep.episode_number, title: ep.name });
          }
        }
      }
    }

    if (selected.length === 0) return;

    this.api.addSeriesToCatalog(this.selectedSeries.id, selected).subscribe({
      next: () => {
        this.showSeriesDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Added', detail: `${selected.length} episodes added` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to add' });
      }
    });
  }
}
