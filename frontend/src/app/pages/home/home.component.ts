import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  trendingMovies: any[] = [];
  trendingTv: any[] = [];
  loading = true;

  showDetailDialog = false;
  selectedItem: any = null;
  isInCatalog = false;
  catalogMediaId: number | null = null;

  showEpisodeSelector = false;
  loadingEpisodes = false;
  seasons: any[] = [];
  private lastClickedEpisode: { season: any; index: number } | null = null;

  ngOnInit(): void {
    this.api.getTrending().subscribe({
      next: (res) => {
        this.trendingMovies = res.movies;
        this.trendingTv = res.tv;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openDetail(item: any): void {
    this.selectedItem = item;
    this.showDetailDialog = true;
    this.isInCatalog = false;
    this.catalogMediaId = null;
    this.showEpisodeSelector = false;
    this.seasons = [];

    this.api.getCatalog().subscribe({
      next: (res) => {
        const found = res.catalog.find((c: any) => c.tmdb_id === item.id);
        if (found) {
          this.isInCatalog = true;
          this.catalogMediaId = found.id;
        }
        this.cdr.detectChanges();
      }
    });
  }

  closeDetail(): void {
    this.showDetailDialog = false;
  }

  addToCatalog(): void {
    if (!this.selectedItem) return;

    if (this.selectedItem.media_type === 'tv') {
      this.loadEpisodes();
      return;
    }

    this.api.addToCatalog(this.selectedItem.id, 'movie').subscribe({
      next: (res) => {
        this.isInCatalog = true;
        this.catalogMediaId = res.media.id;
        this.notify.success(`${this.selectedItem.title} added to catalog`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to add');
      }
    });
  }

  removeFromCatalog(): void {
    if (!this.catalogMediaId) return;

    this.api.removeFromCatalog(this.catalogMediaId).subscribe({
      next: () => {
        this.isInCatalog = false;
        this.catalogMediaId = null;
        this.notify.success(`${this.selectedItem.title} removed from catalog`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to remove');
      }
    });
  }

  viewInCatalog(): void {
    if (this.catalogMediaId) {
      this.showDetailDialog = false;
      this.router.navigate(['/browse', this.catalogMediaId]);
    }
  }

  private loadEpisodes(): void {
    this.showEpisodeSelector = true;
    this.loadingEpisodes = true;
    let pendingSeasons = 0;

    this.api.getSeriesSeasons(this.selectedItem.id).subscribe({
      next: (res) => {
        this.seasons = res.seasons.map((s: any) => ({ ...s, selected: false, episodes: null }));
        pendingSeasons = this.seasons.length;

        for (const season of this.seasons) {
          this.api.getSeasonEpisodes(this.selectedItem.id, season.season_number).subscribe({
            next: (epRes) => {
              season.episodes = epRes.episodes.map((ep: any) => ({ ...ep, selected: false }));
              pendingSeasons--;
              if (pendingSeasons === 0) {
                this.loadingEpisodes = false;
              }
              this.cdr.detectChanges();
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

    this.api.addSeriesToCatalog(this.selectedItem.id, selected).subscribe({
      next: (res) => {
        this.isInCatalog = true;
        this.catalogMediaId = res.media.id;
        this.showEpisodeSelector = false;
        this.notify.success(`${selected.length} episodes added to catalog`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to add');
      }
    });
  }
}
