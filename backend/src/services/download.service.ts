import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';
import { storageService } from './storage.service.js';
import { indexerService } from './indexer.service.js';
import { EventEmitter } from 'events';

export interface DownloadProgress {
  mediaId: number;
  episodeId?: number;
  progress: number;
  downloadSpeed: number;
  status: string;
}

export interface TorrentInfo {
  key: string;
  mediaId: number;
  episodeId?: number;
  mediaTitle: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  size: number;
  numPeers: number;
  numSeeds: number;
  ratio: number;
  timeRemaining: number;
  paused: boolean;
  done: boolean;
  infoHash: string;
  path: string;
}

class DownloadService extends EventEmitter {
  private activeDownloads: Map<string, { progress: number; speed: number }> = new Map();
  private torrentMeta: Map<string, { mediaId: number; episodeId?: number; mediaTitle: string }> = new Map();
  private webtorrentClient: any = null;

  async initialize(): Promise<void> {
    if (config.useMocks) {
      console.log('Download service initialized in mock mode');
      return;
    }

    try {
      const WebTorrent = (await import('webtorrent')).default;
      this.webtorrentClient = new WebTorrent();
      console.log('WebTorrent client initialized');
    } catch (error) {
      console.error('Failed to initialize WebTorrent:', error);
    }
  }

  async startDownload(mediaId: number, episodeId?: number): Promise<{ success: boolean; message: string }> {
    const media = mediaRepository.findById(mediaId);
    if (!media) return { success: false, message: 'Media not found' };

    // Check deduplication
    if (!episodeId && (media.status === 'downloaded' || media.status === 'downloading' || media.status === 'searching')) {
      return { success: false, message: `Media already ${media.status}` };
    }

    if (episodeId) {
      const episode = episodesRepository.findById(episodeId);
      if (!episode) return { success: false, message: 'Episode not found' };
      if (episode.status === 'downloaded' || episode.status === 'downloading' || episode.status === 'searching') {
        return { success: false, message: `Episode already ${episode.status}` };
      }
    }

    // Check storage
    if (storageService.isStorageCritical()) {
      const freed = await storageService.freeSpace();
      if (!freed) {
        return { success: false, message: 'Insufficient storage space' };
      }
    }

    // Search for torrents
    const searchTitle = episodeId
      ? this.buildEpisodeSearchQuery(media, episodeId)
      : media.title;

    const year = media.created_at ? media.created_at.substring(0, 4) : undefined;

    if (episodeId) {
      episodesRepository.updateStatus(episodeId, 'searching');
    } else {
      mediaRepository.updateStatus(mediaId, 'searching');
    }

    const results = await indexerService.searchTorrents(searchTitle, year, media.type);

    if (results.length === 0) {
      if (episodeId) {
        episodesRepository.updateStatus(episodeId, 'not_found');
      } else {
        mediaRepository.updateStatus(mediaId, 'not_found');
      }
      return { success: false, message: 'No torrents found' };
    }

    const bestResult = results[0];

    // Determine destination path
    let destPath: string;
    if (media.type === 'movie') {
      destPath = storageService.getMoviePath(media.title);
    } else if (episodeId) {
      const episode = episodesRepository.findById(episodeId)!;
      destPath = storageService.getEpisodePath(media.title, episode.season_number, episode.episode_number);
    } else {
      destPath = path.join(config.downloadDir, 'series', media.title.replace(/[<>:"/\\|?*]/g, '_'));
    }

    fs.mkdirSync(destPath, { recursive: true });

    if (config.useMocks) {
      return this.simulateDownload(mediaId, episodeId, destPath);
    }

    return this.startRealDownload(bestResult.magnetUri, destPath, mediaId, episodeId);
  }

  private simulateDownload(mediaId: number, episodeId: number | undefined, destPath: string): { success: boolean; message: string } {
    const key = episodeId ? `ep-${episodeId}` : `media-${mediaId}`;
    const media = mediaRepository.findById(mediaId);
    const mediaTitle = media?.title || 'Unknown';

    if (episodeId) {
      episodesRepository.updateStatus(episodeId, 'downloading');
    } else {
      mediaRepository.updateStatus(mediaId, 'downloading');
    }

    this.activeDownloads.set(key, { progress: 0, speed: 0 });
    this.torrentMeta.set(key, { mediaId, episodeId, mediaTitle });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      const speed = Math.random() * 5_000_000;
      this.activeDownloads.set(key, { progress, speed });

      this.emit('progress', {
        mediaId,
        episodeId,
        progress,
        downloadSpeed: speed,
        status: 'downloading',
      } as DownloadProgress);

      if (progress >= 100) {
        clearInterval(interval);
        this.activeDownloads.delete(key);

        const mockFilePath = path.join(destPath, 'video.mp4');
        fs.writeFileSync(mockFilePath, 'mock video content');

        if (episodeId) {
          episodesRepository.updateStatus(episodeId, 'downloaded', mockFilePath);
        } else {
          mediaRepository.updateStatus(mediaId, 'downloaded', mockFilePath);
        }

        this.emit('progress', {
          mediaId,
          episodeId,
          progress: 100,
          downloadSpeed: 0,
          status: 'downloaded',
        } as DownloadProgress);

        this.emit('complete', { mediaId, episodeId, filePath: mockFilePath });
      }
    }, 1000);

    return { success: true, message: 'Download started (mock)' };
  }

  private async startRealDownload(magnetUri: string, destPath: string, mediaId: number, episodeId?: number): Promise<{ success: boolean; message: string }> {
    if (!this.webtorrentClient) {
      return { success: false, message: 'WebTorrent not initialized' };
    }

    const key = episodeId ? `ep-${episodeId}` : `media-${mediaId}`;
    const media = mediaRepository.findById(mediaId);
    const mediaTitle = media?.title || 'Unknown';

    if (episodeId) {
      episodesRepository.updateStatus(episodeId, 'downloading');
    } else {
      mediaRepository.updateStatus(mediaId, 'downloading');
    }

    try {
      this.webtorrentClient.add(magnetUri, { path: destPath }, (torrent: any) => {
        this.activeDownloads.set(key, { progress: 0, speed: 0 });
        this.torrentMeta.set(key, { mediaId, episodeId, mediaTitle });

        torrent.on('download', () => {
          const progress = Math.round(torrent.progress * 100);
          const speed = torrent.downloadSpeed;
          this.activeDownloads.set(key, { progress, speed });

          this.emit('progress', {
            mediaId,
            episodeId,
            progress,
            downloadSpeed: speed,
            status: 'downloading',
          } as DownloadProgress);
        });

        torrent.on('done', () => {
          this.activeDownloads.delete(key);
          const filePath = torrent.files[0]?.path
            ? path.join(destPath, torrent.files[0].path)
            : destPath;

          if (episodeId) {
            episodesRepository.updateStatus(episodeId, 'downloaded', filePath);
          } else {
            mediaRepository.updateStatus(mediaId, 'downloaded', filePath);
          }

          this.emit('progress', {
            mediaId,
            episodeId,
            progress: 100,
            downloadSpeed: 0,
            status: 'downloaded',
          } as DownloadProgress);

          this.emit('complete', { mediaId, episodeId, filePath });
        });
      });

      return { success: true, message: 'Download started' };
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, message: 'Download failed to start' };
    }
  }

  private buildEpisodeSearchQuery(media: any, episodeId: number): string {
    const episode = episodesRepository.findById(episodeId);
    if (!episode) return media.title;
    const s = String(episode.season_number).padStart(2, '0');
    const e = String(episode.episode_number).padStart(2, '0');
    return `${media.title} S${s}E${e}`;
  }

  getActiveDownloads(): DownloadProgress[] {
    const downloads: DownloadProgress[] = [];
    for (const [key, value] of this.activeDownloads.entries()) {
      const isEpisode = key.startsWith('ep-');
      const id = parseInt(key.split('-')[1], 10);
      downloads.push({
        mediaId: isEpisode ? 0 : id,
        episodeId: isEpisode ? id : undefined,
        progress: value.progress,
        downloadSpeed: value.speed,
        status: 'downloading',
      });
    }
    return downloads;
  }

  getAllTorrents(): TorrentInfo[] {
    if (!this.webtorrentClient) {
      return this.getMockTorrents();
    }

    return this.webtorrentClient.torrents.map((torrent: any) => {
      const key = this.findKeyByInfoHash(torrent.infoHash);
      const meta = key ? this.torrentMeta.get(key) : null;

      return {
        key: key || torrent.infoHash,
        mediaId: meta?.mediaId || 0,
        episodeId: meta?.episodeId,
        mediaTitle: meta?.mediaTitle || 'Unknown',
        name: torrent.name || 'Unknown',
        progress: Math.round(torrent.progress * 100),
        downloadSpeed: torrent.downloadSpeed || 0,
        uploadSpeed: torrent.uploadSpeed || 0,
        downloaded: torrent.downloaded || 0,
        uploaded: torrent.uploaded || 0,
        size: torrent.length || 0,
        numPeers: torrent.numPeers || 0,
        numSeeds: torrent.numPeers || 0,
        ratio: torrent.ratio || 0,
        timeRemaining: torrent.timeRemaining || 0,
        paused: torrent.paused || false,
        done: torrent.done || false,
        infoHash: torrent.infoHash,
        path: torrent.path || '',
      } as TorrentInfo;
    });
  }

  private getMockTorrents(): TorrentInfo[] {
    const torrents: TorrentInfo[] = [];
    for (const [key, value] of this.activeDownloads.entries()) {
      const meta = this.torrentMeta.get(key);
      torrents.push({
        key,
        mediaId: meta?.mediaId || 0,
        episodeId: meta?.episodeId,
        mediaTitle: meta?.mediaTitle || 'Unknown',
        name: `${meta?.mediaTitle || 'Unknown'}.torrent`,
        progress: value.progress,
        downloadSpeed: value.speed,
        uploadSpeed: Math.random() * 500_000,
        downloaded: Math.round((value.progress / 100) * 1_500_000_000),
        uploaded: Math.round(Math.random() * 200_000_000),
        size: 1_500_000_000,
        numPeers: Math.floor(Math.random() * 30) + 1,
        numSeeds: Math.floor(Math.random() * 50) + 1,
        ratio: Math.random() * 2,
        timeRemaining: value.progress < 100 ? Math.round(((100 - value.progress) / 10) * 1000) : 0,
        paused: false,
        done: value.progress >= 100,
        infoHash: `mock-${key}`,
        path: '',
      });
    }

    // Also include completed downloads from the database
    const downloaded = mediaRepository.findByStatus('downloaded');
    for (const media of downloaded) {
      if (media.disk_path) {
        torrents.push({
          key: `media-${media.id}`,
          mediaId: media.id,
          mediaTitle: media.title,
          name: `${media.title}`,
          progress: 100,
          downloadSpeed: 0,
          uploadSpeed: 0,
          downloaded: 0,
          uploaded: 0,
          size: 0,
          numPeers: 0,
          numSeeds: 0,
          ratio: 0,
          timeRemaining: 0,
          paused: false,
          done: true,
          infoHash: `completed-media-${media.id}`,
          path: media.disk_path,
        });
      }
    }

    const downloadedEps = episodesRepository.findByStatus('downloaded');
    for (const ep of downloadedEps) {
      const media = mediaRepository.findById(ep.media_id);
      if (ep.disk_path) {
        torrents.push({
          key: `ep-${ep.id}`,
          mediaId: ep.media_id,
          episodeId: ep.id,
          mediaTitle: media?.title || 'Unknown',
          name: `${media?.title || 'Unknown'} S${String(ep.season_number).padStart(2, '0')}E${String(ep.episode_number).padStart(2, '0')}`,
          progress: 100,
          downloadSpeed: 0,
          uploadSpeed: 0,
          downloaded: 0,
          uploaded: 0,
          size: 0,
          numPeers: 0,
          numSeeds: 0,
          ratio: 0,
          timeRemaining: 0,
          paused: false,
          done: true,
          infoHash: `completed-ep-${ep.id}`,
          path: ep.disk_path,
        });
      }
    }

    return torrents;
  }

  private findKeyByInfoHash(infoHash: string): string | undefined {
    if (!this.webtorrentClient) return undefined;
    for (const [key] of this.activeDownloads.entries()) {
      const torrent = this.webtorrentClient.torrents.find((t: any) => {
        const meta = this.torrentMeta.get(key);
        return meta && t.infoHash === infoHash;
      });
      if (torrent) return key;
    }
    return undefined;
  }

  pauseTorrent(infoHash: string): boolean {
    if (!this.webtorrentClient) return false;
    const torrent = this.webtorrentClient.torrents.find((t: any) => t.infoHash === infoHash);
    if (torrent) {
      torrent.pause();
      return true;
    }
    return false;
  }

  resumeTorrent(infoHash: string): boolean {
    if (!this.webtorrentClient) return false;
    const torrent = this.webtorrentClient.torrents.find((t: any) => t.infoHash === infoHash);
    if (torrent) {
      torrent.resume();
      return true;
    }
    return false;
  }

  removeTorrent(infoHash: string): boolean {
    if (!this.webtorrentClient) return false;
    const torrent = this.webtorrentClient.torrents.find((t: any) => t.infoHash === infoHash);
    if (torrent) {
      torrent.destroy();
      return true;
    }
    return false;
  }

  deleteFile(key: string): { success: boolean; message: string } {
    const isEpisode = key.startsWith('ep-');
    const id = parseInt(key.split('-').pop()!, 10);

    if (isEpisode) {
      const episode = episodesRepository.findById(id);
      if (!episode) return { success: false, message: 'Episode not found' };
      if (episode.disk_path && fs.existsSync(episode.disk_path)) {
        fs.rmSync(episode.disk_path, { recursive: true, force: true });
      }
      episodesRepository.updateStatus(id, 'pending');
      return { success: true, message: 'File deleted and status reset' };
    } else {
      const media = mediaRepository.findById(id);
      if (!media) return { success: false, message: 'Media not found' };
      if (media.disk_path && fs.existsSync(media.disk_path)) {
        fs.rmSync(media.disk_path, { recursive: true, force: true });
      }
      mediaRepository.updateStatus(id, 'pending');
      return { success: true, message: 'File deleted and status reset' };
    }
  }

  async resumeDownloads(): Promise<void> {
    const downloadingMedia = mediaRepository.findByStatus('downloading');
    const downloadingEpisodes = episodesRepository.findByStatus('downloading');

    console.log(`Recovery: Found ${downloadingMedia.length} media and ${downloadingEpisodes.length} episodes to resume`);

    for (const media of downloadingMedia) {
      if (media.disk_path && fs.existsSync(media.disk_path)) {
        console.log(`Resuming download for: ${media.title}`);
        await this.startDownload(media.id);
      } else {
        mediaRepository.updateStatus(media.id, 'pending');
      }
    }

    for (const episode of downloadingEpisodes) {
      if (episode.disk_path && fs.existsSync(episode.disk_path)) {
        const media = mediaRepository.findById(episode.media_id);
        if (media) {
          console.log(`Resuming episode download: S${episode.season_number}E${episode.episode_number}`);
          await this.startDownload(media.id, episode.id);
        }
      } else {
        episodesRepository.updateStatus(episode.id, 'pending');
      }
    }
  }
}

export const downloadService = new DownloadService();
