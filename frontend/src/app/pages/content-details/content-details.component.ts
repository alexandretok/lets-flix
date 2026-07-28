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
import { getLanguageOptions } from '../../shared/languages';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-details',
  imports: [CommonModule, FormsModule, Button, Tag, ProgressBarModule, Select, Toast, LayoutComponent],
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
