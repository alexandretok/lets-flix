import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Dialog } from 'primeng/dialog';
import { Checkbox } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { SSEService, DownloadEvent } from '../../services/sse.service';
import { getLanguageOptions } from '../../shared/languages';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-details',
  imports: [CommonModule, FormsModule, Button, Tag, ProgressBarModule, Select, Toast, Dialog, Checkbox],
  providers: [MessageService],
  templateUrl: './content-details.component.html',
  styleUrl: './content-details.component.scss',
})
export class ContentDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private sseService = inject(SSEService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private sseSub?: Subscription;

  media: any = null;
  episodes: any[] = [];
  subtitles: any[] = [];
  downloadProgress = 0;
  downloadSpeed = 0;
  selectedLanguage = '';
  groupedEpisodes: { number: number; episodes: any[] }[] = [];

  // Add episodes dialog
  showAddEpisodesDialog = false;
  tmdbSeasons: any[] = [];
  loadingTmdbSeasons = false;
  private lastAddEpisodeClick: { season: any; index: number } | null = null;

  // Episode subtitle dialog
  showEpisodeSubDialog = false;
  selectedEpisodeForSub: any = null;
  episodeSubtitles: any[] = [];

  languages = getLanguageOptions();

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadMedia(parseInt(id, 10));

    this.sseSub = this.sseService.downloadProgress$.subscribe((event) => {
      if (event.mediaId === this.media?.id) {
        this.downloadProgress = event.progress;
        this.downloadSpeed = event.downloadSpeed;
        if (event.status === 'downloaded') {
          this.loadMedia(this.media.id);
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  loadMedia(id: number): void {
    this.api.getMedia(id).subscribe({
      next: (res) => {
        this.media = res.media;
        this.episodes = res.episodes;
        this.groupEpisodes();
        if (this.media.type === 'movie') {
          this.loadSubtitles();
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadSubtitles(): void {
    if (this.media) {
      this.api.getSubtitles(this.media.id).subscribe({
        next: (res) => { this.subtitles = res.subtitles; this.cdr.detectChanges(); }
      });
    }
  }

  groupEpisodes(): void {
    const groups = new Map<number, any[]>();
    for (const ep of this.episodes) {
      if (!groups.has(ep.season_number)) {
        groups.set(ep.season_number, []);
      }
      groups.get(ep.season_number)!.push(ep);
    }
    this.groupedEpisodes = Array.from(groups.entries())
      .map(([number, episodes]) => ({ number, episodes }))
      .sort((a, b) => a.number - b.number);
  }

  startDownload(): void {
    this.api.startDownload(this.media.id).subscribe({
      next: () => {
        this.media.status = 'downloading';
        this.messageService.add({ severity: 'success', summary: 'Started', detail: 'Download started' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed' });
        this.cdr.detectChanges();
      }
    });
  }

  startEpisodeDownload(episodeId: number): void {
    this.api.startDownload(this.media.id, episodeId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Started', detail: 'Episode download started' });
        this.loadMedia(this.media.id);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed' });
        this.cdr.detectChanges();
      }
    });
  }

  retrySearch(): void {
    this.api.retryDownload(this.media.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Retrying', detail: 'Searching for torrents...' });
        this.loadMedia(this.media.id);
      }
    });
  }

  retryEpisodeSearch(episodeId: number): void {
    this.api.retryDownload(this.media.id, episodeId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Retrying', detail: 'Searching for episode...' });
        this.loadMedia(this.media.id);
      }
    });
  }

  removeFromCatalog(): void {
    this.api.removeFromCatalog(this.media.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Removed', detail: `${this.media.title} removed from catalog` });
        this.router.navigate(['/browse']);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to remove' });
        this.cdr.detectChanges();
      }
    });
  }

  removeEpisode(episodeId: number): void {
    this.api.removeEpisode(episodeId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Episode removed' });
        this.loadMedia(this.media.id);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to remove' });
      }
    });
  }

  play(): void {
    this.router.navigate(['/watch', this.media.id]);
  }

  playEpisode(episodeId: number): void {
    this.router.navigate(['/watch', `ep-${episodeId}`]);
  }

  // Movie subtitles
  downloadSubtitle(): void {
    if (!this.selectedLanguage) return;
    this.api.searchSubtitles(this.media.id, this.selectedLanguage).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.api.downloadSubtitle(res.results[0].fileId, this.media.id, this.selectedLanguage).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: `Subtitle (${this.selectedLanguage}) downloaded` });
              this.loadSubtitles();
            }
          });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Not Found', detail: 'No subtitles found for this language' });
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Episode subtitles
  openEpisodeSubtitleDialog(ep: any): void {
    this.selectedEpisodeForSub = ep;
    this.episodeSubtitles = [];
    this.selectedLanguage = '';
    this.showEpisodeSubDialog = true;

    this.api.getEpisodeSubtitles(ep.id).subscribe({
      next: (res) => {
        this.episodeSubtitles = res.subtitles;
        this.cdr.detectChanges();
      }
    });
  }

  downloadEpisodeSubtitle(): void {
    if (!this.selectedLanguage || !this.selectedEpisodeForSub) return;
    this.api.searchSubtitles(this.media.id, this.selectedLanguage).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.api.downloadSubtitle(res.results[0].fileId, this.media.id, this.selectedLanguage, this.selectedEpisodeForSub.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: `Subtitle (${this.selectedLanguage}) downloaded` });
              this.api.getEpisodeSubtitles(this.selectedEpisodeForSub.id).subscribe({
                next: (subRes) => {
                  this.episodeSubtitles = subRes.subtitles;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Not Found', detail: 'No subtitles found for this language' });
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Add episodes dialog
  openAddEpisodesDialog(): void {
    this.showAddEpisodesDialog = true;
    this.tmdbSeasons = [];
    this.loadingTmdbSeasons = true;

    this.api.getSeriesSeasons(this.media.tmdb_id).subscribe({
      next: (res) => {
        this.tmdbSeasons = res.seasons.map((s: any) => ({ ...s, selected: false, episodes: null }));
        let pending = this.tmdbSeasons.length;

        for (const season of this.tmdbSeasons) {
          this.api.getSeasonEpisodes(this.media.tmdb_id, season.season_number).subscribe({
            next: (epRes) => {
              season.episodes = epRes.episodes.map((ep: any) => {
                const existing = this.episodes.find(
                  e => e.season_number === season.season_number && e.episode_number === ep.episode_number
                );
                return { ...ep, selected: !!existing, alreadyAdded: !!existing, existingId: existing?.id };
              });
              this.onAddEpisodeToggle(season);
              pending--;
              if (pending === 0) {
                this.loadingTmdbSeasons = false;
              }
              this.cdr.detectChanges();
            }
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleAddSeason(season: any): void {
    if (season.episodes) {
      for (const ep of season.episodes) {
        ep.selected = season.selected;
      }
    }
  }

  onAddEpisodeClick(event: MouseEvent, season: any, ep: any): void {
    if (event.shiftKey && this.lastAddEpisodeClick && this.lastAddEpisodeClick.season === season) {
      const episodes = season.episodes;
      const currentIndex = episodes.indexOf(ep);
      const lastIndex = this.lastAddEpisodeClick.index;
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const value = !ep.selected;
      for (let i = start; i <= end; i++) {
        episodes[i].selected = value;
      }
      this.onAddEpisodeToggle(season);
    } else {
      ep.selected = !ep.selected;
      this.onAddEpisodeToggle(season);
    }
    this.lastAddEpisodeClick = { season, index: season.episodes.indexOf(ep) };
  }

  onAddEpisodeToggle(season: any): void {
    if (season.episodes) {
      season.selected = season.episodes.length > 0 && season.episodes.every((ep: any) => ep.selected);
    }
  }

  hasEpisodeChanges(): boolean {
    return this.tmdbSeasons.some(s => s.episodes?.some((ep: any) =>
      (ep.selected && !ep.alreadyAdded) || (!ep.selected && ep.alreadyAdded)
    ));
  }

  saveEpisodeChanges(): void {
    const toAdd: { season: number; episode: number; title?: string }[] = [];
    const toRemove: number[] = [];

    for (const season of this.tmdbSeasons) {
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

    let pending = 0;
    if (toRemove.length > 0) pending++;
    if (toAdd.length > 0) pending++;

    const done = () => {
      pending--;
      if (pending === 0) {
        this.showAddEpisodesDialog = false;
        const parts: string[] = [];
        if (toAdd.length > 0) parts.push(`${toAdd.length} added`);
        if (toRemove.length > 0) parts.push(`${toRemove.length} removed`);
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Episodes: ${parts.join(', ')}` });
        this.loadMedia(this.media.id);
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
      this.api.addEpisodes(this.media.id, toAdd).subscribe({
        next: () => done(),
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to add' });
          done();
        }
      });
    }
  }

  formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '';
    const mbps = bytesPerSec / 1_048_576;
    return `${mbps.toFixed(1)} MB/s`;
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
