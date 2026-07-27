import { getDb } from '../database/init.js';

export interface Media {
  id: number;
  tmdb_id: number;
  type: 'movie' | 'series';
  title: string;
  poster_url: string | null;
  overview: string | null;
  status: 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
  disk_path: string | null;
  duration: number | null;
  downloaded_at: string | null;
  created_at: string;
}

export const mediaRepository = {
  findById(id: number): Media | undefined {
    return getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as Media | undefined;
  },

  findByTmdbId(tmdbId: number): Media | undefined {
    return getDb().prepare('SELECT * FROM media WHERE tmdb_id = ?').get(tmdbId) as Media | undefined;
  },

  findAll(): Media[] {
    return getDb().prepare('SELECT * FROM media ORDER BY created_at DESC').all() as Media[];
  },

  findByStatus(status: string): Media[] {
    return getDb().prepare('SELECT * FROM media WHERE status = ?').all(status) as Media[];
  },

  create(data: Omit<Media, 'id' | 'created_at' | 'downloaded_at'>): Media {
    const result = getDb().prepare(
      `INSERT INTO media (tmdb_id, type, title, poster_url, overview, status, disk_path, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(data.tmdb_id, data.type, data.title, data.poster_url, data.overview, data.status, data.disk_path, data.duration);
    return this.findById(result.lastInsertRowid as number)!;
  },

  updateStatus(id: number, status: Media['status'], diskPath?: string): void {
    if (diskPath) {
      getDb().prepare('UPDATE media SET status = ?, disk_path = ?, downloaded_at = datetime(\'now\') WHERE id = ?').run(status, diskPath, id);
    } else {
      getDb().prepare('UPDATE media SET status = ? WHERE id = ?').run(status, id);
    }
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
  },

  getCatalogLinkCount(mediaId: number): number {
    const result = getDb().prepare('SELECT COUNT(*) as count FROM user_catalog WHERE media_id = ?').get(mediaId) as { count: number };
    return result.count;
  },
};
