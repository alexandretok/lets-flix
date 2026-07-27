import { Injectable, inject, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

export interface DownloadEvent {
  mediaId: number;
  episodeId?: number;
  progress: number;
  downloadSpeed: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class SSEService {
  private authStore = inject(AuthStore);
  private zone = inject(NgZone);
  private eventSource: EventSource | null = null;

  downloadProgress$ = new Subject<DownloadEvent>();

  connect(): void {
    if (this.eventSource) return;

    const token = this.authStore.token();
    const url = `/api/events${token ? `?token=${token}` : ''}`;

    this.zone.runOutsideAngular(() => {
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('download-progress', (event: MessageEvent) => {
        const data = JSON.parse(event.data) as DownloadEvent;
        this.zone.run(() => this.downloadProgress$.next(data));
      });

      this.eventSource.onerror = () => {
        this.disconnect();
        setTimeout(() => this.connect(), 5000);
      };
    });
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
