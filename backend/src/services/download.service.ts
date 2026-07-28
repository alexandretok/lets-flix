import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';
import { storageService } from './storage.service.js';
import { indexerService } from './indexer.service.js';
import { EventEmitter } from 'events';
import { DownloadProgress, TorrentInfo } from '../types/index.js';
export type { DownloadProgress, TorrentInfo } from '../types/index.js';

class DownloadService extends EventEmitter {
  private activeDownloads: Map<string, { progress: number; speed: number }> = new Map();
  private torrentMeta: Map<string, { mediaId: number; episodeId?: number; mediaTitle: string }> = new Map();
  private webtorrentClient: any = null;

  async initialize(): Promise<void> {
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

    if (storageService.isStorageCritical()) {
      const freed = await storageService.freeSpace();
      if (!freed) {
        return { success: false, message: 'Insufficient storage space' };
      }
    }

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

    return this.startRealDownload(bestResult.magnetUri, destPath, mediaId, episodeId);
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
      return [];
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
