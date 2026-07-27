import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { ApiService } from '../../services/api.service';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-watch',
  imports: [CommonModule, Button],
  template: `
    <div class="player-container">
      <div class="player-header">
        <p-button icon="pi pi-arrow-left" [text]="true" (onClick)="goBack()" label="Back" />
        <span class="title">{{ title }}</span>
      </div>
      <div class="video-wrapper">
        <video #videoPlayer controls crossorigin="anonymous" class="video-player">
          <source [src]="videoSrc" type="video/mp4" />
          @for (sub of subtitles; track sub.id) {
            <track [src]="'/api/stream/subtitle/' + sub.id" [srclang]="sub.language_code" [label]="sub.language_code" kind="subtitles" />
          }
        </video>
      </div>
    </div>
  `,
  styles: [`
    .player-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }
    .player-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.8);
    }
    .title { color: #e0e0e0; font-size: 1.1rem; }
    .video-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; }
    .video-player { width: 100%; height: 100%; max-height: calc(100vh - 60px); }
  `]
})
export class WatchComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  title = '';
  videoSrc = '';
  subtitles: any[] = [];
  private mediaId?: number;
  private episodeId?: number;
  private progressInterval?: any;
  private startTime = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];

    if (id.startsWith('ep-')) {
      this.episodeId = parseInt(id.replace('ep-', ''), 10);
      this.videoSrc = `/api/stream/episode/${this.episodeId}`;
      this.loadEpisodeSubtitles();
      this.loadEpisodeProgress();
    } else {
      this.mediaId = parseInt(id, 10);
      this.videoSrc = `/api/stream/${this.mediaId}`;
      this.loadMediaDetails();
      this.loadSubtitles();
      this.loadProgress();
    }
  }

  ngAfterViewInit(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    video.addEventListener('loadedmetadata', () => {
      if (this.startTime > 0) {
        video.currentTime = this.startTime;
      }
    });

    // Progress heartbeat every 10 seconds
    this.progressInterval = setInterval(() => {
      if (video && !video.paused && video.currentTime > 0) {
        this.saveProgress(video.currentTime);
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    const video = this.videoRef?.nativeElement;
    if (video && video.currentTime > 0) {
      this.saveProgress(video.currentTime);
    }
  }

  private loadMediaDetails(): void {
    if (this.mediaId) {
      this.api.getMedia(this.mediaId).subscribe({
        next: (res) => { this.title = res.media.title; }
      });
    }
  }

  private loadSubtitles(): void {
    if (this.mediaId) {
      this.api.getSubtitles(this.mediaId).subscribe({
        next: (res) => { this.subtitles = res.subtitles; }
      });
    }
  }

  private loadEpisodeSubtitles(): void {
    if (this.episodeId) {
      this.api.getEpisodeSubtitles(this.episodeId).subscribe({
        next: (res) => { this.subtitles = res.subtitles; }
      });
    }
  }

  private loadProgress(): void {
    if (this.mediaId) {
      this.api.getProgress(this.mediaId).subscribe({
        next: (res) => {
          if (res.progress && res.progress.stopped_at_seconds > 0) {
            this.startTime = res.progress.stopped_at_seconds;
          }
        }
      });
    }
  }

  private loadEpisodeProgress(): void {
    if (this.episodeId) {
      this.api.getEpisodeProgress(this.episodeId).subscribe({
        next: (res) => {
          if (res.progress && res.progress.stopped_at_seconds > 0) {
            this.startTime = res.progress.stopped_at_seconds;
          }
        }
      });
    }
  }

  private saveProgress(seconds: number): void {
    const video = this.videoRef?.nativeElement;
    const duration = video?.duration ? Math.floor(video.duration) : undefined;
    this.api.saveProgress(this.mediaId, this.episodeId, seconds, duration).subscribe();
  }

  goBack(): void {
    if (this.mediaId) {
      this.router.navigate(['/browse', this.mediaId]);
    } else {
      this.router.navigate(['/browse']);
    }
  }
}
