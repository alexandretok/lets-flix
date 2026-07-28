import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { watchProgressRepository } from '../repositories/watch-progress.repository.js';
import { DiskUsage } from '../types/index.js';
export type { DiskUsage } from '../types/index.js';

export const storageService = {
  getDiskUsage(): DiskUsage {
    try {
      const downloadDir = path.resolve(config.downloadDir);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const stats = fs.statfsSync(downloadDir);
      const total = stats.bsize * stats.blocks;
      const free = stats.bsize * stats.bavail;
      const used = total - free;
      const percentage = Math.round((used / total) * 100);

      return { total, used, free, percentage };
    } catch {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  },

  isStorageCritical(): boolean {
    const usage = this.getDiskUsage();
    return usage.percentage > 95;
  },

  isStorageWarning(): boolean {
    const usage = this.getDiskUsage();
    return usage.percentage > 80;
  },

  async freeSpace(): Promise<boolean> {
    // Phase 1: Files watched by ALL users
    const allMedia = mediaRepository.findByStatus('downloaded');
    for (const media of allMedia) {
      if (watchProgressRepository.isWatchedByAllUsers(media.id)) {
        this.deleteMediaFile(media.id);
        if (!this.isStorageCritical()) return true;
      }
    }

    // Phase 2: Oldest never-watched files
    const unwatched = watchProgressRepository.getUnwatchedMediaOldest();
    for (const item of unwatched) {
      this.deleteMediaFile(item.media_id);
      if (!this.isStorageCritical()) return true;
    }

    // Phase 3: Oldest watched files
    const watched = watchProgressRepository.getWatchedMediaOldest();
    for (const item of watched) {
      this.deleteMediaFile(item.media_id);
      if (!this.isStorageCritical()) return true;
    }

    return !this.isStorageCritical();
  },

  deleteMediaFile(mediaId: number): void {
    const media = mediaRepository.findById(mediaId);
    if (!media || !media.disk_path) return;

    try {
      if (fs.existsSync(media.disk_path)) {
        const dir = path.dirname(media.disk_path);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Failed to delete file for media ${mediaId}:`, error);
    }

    mediaRepository.updateStatus(mediaId, 'pending');
  },

  getMoviePath(title: string, year?: string): string {
    const folderName = year ? `${title} (${year})` : title;
    const safeName = folderName.replace(/[<>:"/\\|?*]/g, '_');
    return path.join(config.downloadDir, 'movies', safeName);
  },

  getEpisodePath(seriesTitle: string, seasonNumber: number, episodeNumber: number): string {
    const safeName = seriesTitle.replace(/[<>:"/\\|?*]/g, '_');
    const seasonDir = `season-${String(seasonNumber).padStart(2, '0')}`;
    const episodeDir = `episode-${String(episodeNumber).padStart(2, '0')}`;
    return path.join(config.downloadDir, 'series', safeName, seasonDir, episodeDir);
  },
};
