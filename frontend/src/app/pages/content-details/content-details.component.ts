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
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { SSEService } from '../../services/sse.service';
import { getLanguageOptions } from '../../shared/languages';
import { EpisodeSelectorComponent, EpisodeSaveResult } from '../../components/episode-selector/episode-selector.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-details',
  imports: [CommonModule, FormsModule, Button, Tag, ProgressBarModule, Select, Toast, Dialog, EpisodeSelectorComponent],
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

  // Episode selector
  showEpisodeSelector = false;

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

  // Episode selector
  openAddEpisodesDialog(): void {
    this.showEpisodeSelector = true;
  }

  onEpisodesSaved(result: EpisodeSaveResult): void {
    const parts: string[] = [];
    if (result.added > 0) parts.push(`${result.added} added`);
    if (result.removed > 0) parts.push(`${result.removed} removed`);
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Episodes: ${parts.join(', ')}` });
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
