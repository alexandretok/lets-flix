import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { Checkbox } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, InputText, Button, Dialog, Toast, Checkbox],
  providers: [MessageService],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
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
  previewImageUrl: string | null = null;
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
