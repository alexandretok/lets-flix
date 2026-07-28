import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { SSEService } from '../../services/sse.service';
import { NotificationService } from '../../services/notification.service';
import { getLanguageOptions } from '../../shared/languages';
import { EpisodeSelectorComponent, EpisodeSaveResult } from '../../components/episode-selector/episode-selector.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-details',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule, MatTooltipModule, EpisodeSelectorComponent],
  templateUrl: './content-details.component.html',
  styleUrl: './content-details.component.scss',
})
export class ContentDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private sseService = inject(SSEService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private sseSub?: Subscription;

  media: any = null;
  episodes: any[] = [];
  subtitles: any[] = [];
  downloadProgress = 0;
  downloadSpeed = 0;
  selectedLanguage = '';
  groupedEpisodes: { number: number; episodes: any[] }[] = [];

  showEpisodeSelector = false;

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
        this.notify.success('Download started');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed');
        this.cdr.detectChanges();
      }
    });
  }

  startEpisodeDownload(episodeId: number): void {
    this.api.startDownload(this.media.id, episodeId).subscribe({
      next: () => {
        this.notify.success('Episode download started');
        this.loadMedia(this.media.id);
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed');
        this.cdr.detectChanges();
      }
    });
  }

  retrySearch(): void {
    this.api.retryDownload(this.media.id).subscribe({
      next: () => {
        this.notify.info('Searching for torrents...');
        this.loadMedia(this.media.id);
      }
    });
  }

  retryEpisodeSearch(episodeId: number): void {
    this.api.retryDownload(this.media.id, episodeId).subscribe({
      next: () => {
        this.notify.info('Searching for episode...');
        this.loadMedia(this.media.id);
      }
    });
  }

  removeFromCatalog(): void {
    this.api.removeFromCatalog(this.media.id).subscribe({
      next: () => {
        this.notify.success(`${this.media.title} removed from catalog`);
        this.router.navigate(['/browse']);
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to remove');
        this.cdr.detectChanges();
      }
    });
  }

  removeEpisode(episodeId: number): void {
    this.api.removeEpisode(episodeId).subscribe({
      next: () => {
        this.notify.success('Episode removed');
        this.loadMedia(this.media.id);
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to remove');
      }
    });
  }

  play(): void {
    this.router.navigate(['/watch', this.media.id]);
  }

  playEpisode(episodeId: number): void {
    this.router.navigate(['/watch', `ep-${episodeId}`]);
  }

  downloadSubtitle(): void {
    if (!this.selectedLanguage) return;
    this.api.searchSubtitles(this.media.id, this.selectedLanguage).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.api.downloadSubtitle(res.results[0].fileId, this.media.id, this.selectedLanguage).subscribe({
            next: () => {
              this.notify.success(`Subtitle (${this.selectedLanguage}) downloaded`);
              this.loadSubtitles();
            }
          });
        } else {
          this.notify.warn('No subtitles found for this language');
        }
        this.cdr.detectChanges();
      }
    });
  }

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

  closeEpisodeSubDialog(): void {
    this.showEpisodeSubDialog = false;
  }

  downloadEpisodeSubtitle(): void {
    if (!this.selectedLanguage || !this.selectedEpisodeForSub) return;
    this.api.searchSubtitles(this.media.id, this.selectedLanguage).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.api.downloadSubtitle(res.results[0].fileId, this.media.id, this.selectedLanguage, this.selectedEpisodeForSub.id).subscribe({
            next: () => {
              this.notify.success(`Subtitle (${this.selectedLanguage}) downloaded`);
              this.api.getEpisodeSubtitles(this.selectedEpisodeForSub.id).subscribe({
                next: (subRes) => {
                  this.episodeSubtitles = subRes.subtitles;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        } else {
          this.notify.warn('No subtitles found for this language');
        }
        this.cdr.detectChanges();
      }
    });
  }

  openAddEpisodesDialog(): void {
    this.showEpisodeSelector = true;
  }

  onEpisodesSaved(result: EpisodeSaveResult): void {
    const parts: string[] = [];
    if (result.added > 0) parts.push(`${result.added} added`);
    if (result.removed > 0) parts.push(`${result.removed} removed`);
    this.notify.success(`Episodes: ${parts.join(', ')}`);
    this.loadMedia(this.media.id);
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
