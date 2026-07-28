import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { ApiService } from '../../services/api.service';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-watch',
  imports: [CommonModule, Button],
  templateUrl: './watch.component.html',
  styleUrl: './watch.component.scss',
})
export class WatchComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

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
        next: (res) => { this.title = res.media.title; this.cdr.markForCheck(); }
      });
    }
  }

  private loadSubtitles(): void {
    if (this.mediaId) {
      this.api.getSubtitles(this.mediaId).subscribe({
        next: (res) => { this.subtitles = res.subtitles; this.cdr.markForCheck(); }
      });
    }
  }

  private loadEpisodeSubtitles(): void {
    if (this.episodeId) {
      this.api.getEpisodeSubtitles(this.episodeId).subscribe({
        next: (res) => { this.subtitles = res.subtitles; this.cdr.markForCheck(); }
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
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
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
