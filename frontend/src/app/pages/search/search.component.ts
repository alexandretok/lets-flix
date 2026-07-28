import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  seasons: any[] = [];
  previewImageUrl: string | null = null;
  private lastClickedEpisode: { season: any; index: number } | null = null;
  private existingMediaId: number | null = null;
  private existingEpisodes: any[] = [];

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
    this.seasons = [];
    this.showSeriesDialog = true;
    this.existingMediaId = null;
    this.existingEpisodes = [];

    this.api.getMediaByTmdbId(item.id).subscribe({
      next: (res) => {
        this.existingMediaId = res.media.id;
        this.existingEpisodes = res.episodes;
        this.loadSeriesSeasons(item.id);
      },
      error: () => {
        this.loadSeriesSeasons(item.id);
      }
    });
  }

  private loadSeriesSeasons(tmdbId: number): void {
    this.api.getSeriesSeasons(tmdbId).subscribe({
      next: (res) => {
        this.seasons = res.seasons.map((s: any) => ({ ...s, selected: false, episodes: null }));
        let pending = this.seasons.length;

        for (const season of this.seasons) {
          this.api.getSeasonEpisodes(tmdbId, season.season_number).subscribe({
            next: (epRes) => {
              season.episodes = epRes.episodes.map((ep: any) => {
                const existing = this.existingEpisodes.find(
                  e => e.season_number === season.season_number && e.episode_number === ep.episode_number
                );
                return { ...ep, selected: !!existing, alreadyAdded: !!existing, existingId: existing?.id };
              });
              this.onEpisodeToggle(season);
              pending--;
              if (pending === 0) {
                this.cdr.detectChanges();
              }
            }
          });
        }
        this.cdr.detectChanges();
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

  hasEpisodeChanges(): boolean {
    return this.seasons.some(s => s.episodes?.some((ep: any) =>
      (ep.selected && !ep.alreadyAdded) || (!ep.selected && ep.alreadyAdded)
    ));
  }

  saveEpisodeChanges(): void {
    const toAdd: any[] = [];
    const toRemove: number[] = [];

    for (const season of this.seasons) {
      if (season.episodes) {
        for (const ep of season.episodes) {
          if (ep.selected && !ep.alreadyAdded) {
            toAdd.push({ season: season.season_number, episode: ep.episode_number, title: ep.name });
          } else if (!ep.selected && ep.alreadyAdded && ep.existingId) {
            toRemove.push(ep.existingId);
          }
        }
      }
    }

    if (toAdd.length === 0 && toRemove.length === 0) return;

    if (this.existingMediaId) {
      let pending = 0;
      if (toRemove.length > 0) pending++;
      if (toAdd.length > 0) pending++;

      const done = () => {
        pending--;
        if (pending === 0) {
          this.showSeriesDialog = false;
          const parts: string[] = [];
          if (toAdd.length > 0) parts.push(`${toAdd.length} added`);
          if (toRemove.length > 0) parts.push(`${toRemove.length} removed`);
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Episodes: ${parts.join(', ')}` });
        }
      };

      if (toRemove.length > 0) {
        let removePending = toRemove.length;
        for (const id of toRemove) {
          this.api.removeEpisode(id).subscribe({
            next: () => { removePending--; if (removePending === 0) done(); },
            error: () => { removePending--; if (removePending === 0) done(); }
          });
        }
      }

      if (toAdd.length > 0) {
        this.api.addEpisodes(this.existingMediaId, toAdd).subscribe({
          next: () => done(),
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to add' });
            done();
          }
        });
      }
    } else {
      this.api.addSeriesToCatalog(this.selectedSeries.id, toAdd).subscribe({
        next: () => {
          this.showSeriesDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Added', detail: `${toAdd.length} episodes added` });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to add' });
        }
      });
    }
  }
}
