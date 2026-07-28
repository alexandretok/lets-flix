import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutComponent } from '../../layout/layout.component';
import { ApiService } from '../../services/api.service';
import { SSEService, DownloadEvent } from '../../services/sse.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-details',
  imports: [CommonModule, FormsModule, Button, Tag, ProgressBarModule, Select, Toast, LayoutComponent],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      @if (media) {
        <div class="details-container">
          <div class="details-header">
            <div class="poster-section">
              @if (media.poster_url) {
                <img [src]="media.poster_url" [alt]="media.title" class="detail-poster" />
              } @else {
                <div class="placeholder-poster"><i class="pi pi-image"></i></div>
              }
            </div>
            <div class="info-section">
              <h1>{{ media.title }}</h1>
              <div class="meta-row">
                <p-tag [value]="media.type" severity="info" />
                <p-tag [value]="media.status" [severity]="getStatusSeverity(media.status)" />
              </div>
              <p class="overview">{{ media.overview }}</p>

              <div class="actions">
                @if (media.status === 'not_found') {
                  <p-button label="Retry Torrent Search" icon="pi pi-refresh" severity="warn" (onClick)="retrySearch()" />
                }
                @if (media.status === 'pending' && media.type === 'movie') {
                  <p-button label="Start Download" icon="pi pi-download" severity="danger" (onClick)="startDownload()" />
                }
                @if (media.status === 'downloaded') {
                  <p-button label="Play" icon="pi pi-play" severity="success" (onClick)="play()" />
                }
                @if (media.status === 'downloading') {
                  <div class="download-progress">
                    <p-progressbar [value]="downloadProgress" />
                    <span class="speed">{{ formatSpeed(downloadSpeed) }}</span>
                  </div>
                }
              </div>

              <div class="subtitle-section">
                <h3>Subtitles</h3>
                <div class="subtitle-downloader">
                  <p-select [options]="languages" [(ngModel)]="selectedLanguage" optionLabel="label" optionValue="value" placeholder="Select language" />
                  <p-button label="Download" icon="pi pi-download" size="small" (onClick)="downloadSubtitle()" [disabled]="!selectedLanguage" />
                </div>
                @if (subtitles.length > 0) {
                  <div class="subtitle-list">
                    @for (sub of subtitles; track sub.id) {
                      <span class="subtitle-tag"><i class="pi pi-file"></i> {{ sub.language_code }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          @if (media.type === 'series' && episodes.length > 0) {
            <div class="episodes-section">
              <h2>Episodes</h2>
              @for (season of groupedEpisodes; track season.number) {
                <div class="season-group">
                  <h3>Season {{ season.number }}</h3>
                  <div class="episode-list">
                    @for (ep of season.episodes; track ep.id) {
                      <div class="episode-row">
                        <span class="ep-number">E{{ ep.episode_number }}</span>
                        <span class="ep-title">{{ ep.title || 'Episode ' + ep.episode_number }}</span>
                        <p-tag [value]="ep.status" [severity]="getStatusSeverity(ep.status)" />
                        @if (ep.status === 'pending') {
                          <p-button icon="pi pi-download" [text]="true" size="small" (onClick)="startEpisodeDownload(ep.id)" />
                        }
                        @if (ep.status === 'not_found') {
                          <p-button icon="pi pi-refresh" [text]="true" size="small" severity="warn" (onClick)="retryEpisodeSearch(ep.id)" />
                        }
                        @if (ep.status === 'downloaded') {
                          <p-button icon="pi pi-play" [text]="true" size="small" severity="success" (onClick)="playEpisode(ep.id)" />
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </app-layout>
  `,
  styles: [`
    .details-container { max-width: 1000px; }
    .details-header { display: flex; gap: 2rem; margin-bottom: 2rem; }
    .poster-section { flex-shrink: 0; }
    .detail-poster { width: 250px; border-radius: 12px; }
    .placeholder-poster {
      width: 250px;
      aspect-ratio: 2/3;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      border-radius: 12px;
      font-size: 3rem;
      color: #555;
    }
    .info-section { flex: 1; }
    .info-section h1 { color: #e0e0e0; margin: 0 0 0.75rem; }
    .meta-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .overview { color: #a0a0a0; line-height: 1.6; }
    .actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 1.5rem 0; }
    .download-progress { flex: 1; max-width: 300px; }
    .speed { font-size: 0.8rem; color: #a0a0a0; }
    .subtitle-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .subtitle-section h3 { color: #e0e0e0; margin: 0 0 0.75rem; }
    .subtitle-downloader { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
    .subtitle-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .subtitle-tag {
      background: rgba(255,255,255,0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #e0e0e0;
    }
    .episodes-section { margin-top: 2rem; }
    .episodes-section h2 { color: #e0e0e0; }
    .season-group { margin-bottom: 1.5rem; }
    .season-group h3 { color: #ccc; margin: 0 0 0.5rem; }
    .episode-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .episode-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
    }
    .ep-number { color: #e94560; font-weight: bold; min-width: 30px; }
    .ep-title { color: #e0e0e0; flex: 1; }
  `]
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

  languages = [
    { label: 'English', value: 'en' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' },
  ];

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
        this.cdr.markForCheck();
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
        this.loadSubtitles();
        this.cdr.markForCheck();
      }
    });
  }

  loadSubtitles(): void {
    if (this.media) {
      this.api.getSubtitles(this.media.id).subscribe({
        next: (res) => { this.subtitles = res.subtitles; this.cdr.markForCheck(); }
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed' });
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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
              this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: `Subtitle (${this.selectedLanguage}) downloaded` });
              this.loadSubtitles();
            }
          });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Not Found', detail: 'No subtitles found for this language' });
        }
        this.cdr.markForCheck();
      }
    });
  }

  formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '';
    const mbps = bytesPerSec / 1_048_576;
    return `${mbps.toFixed(1)} MB/s`;
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
