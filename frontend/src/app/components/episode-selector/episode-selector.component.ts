import { Component, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { ApiService } from '../../services/api.service';

export interface EpisodeSaveResult {
  added: number;
  removed: number;
}

@Component({
  selector: 'app-episode-selector',
  imports: [CommonModule, FormsModule, Dialog, Checkbox, Button],
  templateUrl: './episode-selector.component.html',
  styleUrl: './episode-selector.component.scss',
})
export class EpisodeSelectorComponent implements OnChanges {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() tmdbId!: number;
  @Input() mediaId: number | null = null;
  @Input() existingEpisodes: any[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<EpisodeSaveResult>();

  seasons: any[] = [];
  loading = false;
  private lastClickedEpisode: { season: any; index: number } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.tmdbId) {
      this.loadSeasons();
    }
  }

  private loadSeasons(): void {
    this.seasons = [];
    this.loading = true;
    this.lastClickedEpisode = null;

    this.api.getSeriesSeasons(this.tmdbId).subscribe({
      next: (res) => {
        const multiSeason = res.seasons.length > 1;
        this.seasons = res.seasons.map((s: any) => ({
          ...s, selected: false, indeterminate: false, collapsed: multiSeason, episodes: null
        }));
        let pending = this.seasons.length;

        for (const season of this.seasons) {
          this.api.getSeasonEpisodes(this.tmdbId, season.season_number).subscribe({
            next: (epRes) => {
              season.episodes = epRes.episodes.map((ep: any) => {
                const existing = this.existingEpisodes.find(
                  e => e.season_number === season.season_number && e.episode_number === ep.episode_number
                );
                return { ...ep, selected: !!existing, alreadyAdded: !!existing, existingId: existing?.id };
              });
              this.updateSeasonCheckbox(season);
              pending--;
              if (pending === 0) {
                this.loading = false;
              }
              this.cdr.detectChanges();
            }
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleCollapse(season: any): void {
    season.collapsed = !season.collapsed;
  }

  toggleSeason(season: any): void {
    if (season.indeterminate) {
      season.selected = true;
      season.indeterminate = false;
    }
    if (season.episodes) {
      for (const ep of season.episodes) {
        ep.selected = season.selected;
      }
    }
    season.indeterminate = false;
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
      this.updateSeasonCheckbox(season);
    } else {
      ep.selected = !ep.selected;
      this.updateSeasonCheckbox(season);
    }
    this.lastClickedEpisode = { season, index: season.episodes.indexOf(ep) };
  }

  private updateSeasonCheckbox(season: any): void {
    if (season.episodes && season.episodes.length > 0) {
      const allSelected = season.episodes.every((ep: any) => ep.selected);
      const noneSelected = season.episodes.every((ep: any) => !ep.selected);
      season.selected = allSelected;
      season.indeterminate = !allSelected && !noneSelected;
    }
  }

  hasChanges(): boolean {
    return this.seasons.some(s => s.episodes?.some((ep: any) =>
      (ep.selected && !ep.alreadyAdded) || (!ep.selected && ep.alreadyAdded)
    ));
  }

  save(): void {
    const toAdd: { season: number; episode: number; title?: string }[] = [];
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

    if (this.mediaId) {
      let pending = 0;
      if (toRemove.length > 0) pending++;
      if (toAdd.length > 0) pending++;

      const done = () => {
        pending--;
        if (pending === 0) {
          this.close();
          this.saved.emit({ added: toAdd.length, removed: toRemove.length });
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
        this.api.addEpisodes(this.mediaId, toAdd).subscribe({
          next: () => done(),
          error: () => done()
        });
      }
    } else {
      this.api.addSeriesToCatalog(this.tmdbId, toAdd).subscribe({
        next: () => {
          this.close();
          this.saved.emit({ added: toAdd.length, removed: toRemove.length });
        },
        error: () => {
          this.close();
        }
      });
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
  }
}
