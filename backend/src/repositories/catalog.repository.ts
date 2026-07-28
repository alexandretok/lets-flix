import { getDb } from '../database/init.js';
import { Media } from './media.repository.js';

export interface UserCatalog {
  id: number;
  user_id: number;
  media_id: number;
  added_at: string;
}

export interface CatalogMediaItem extends Media {
  added_at: string;
  last_watched_at: string | null;
}

export const catalogRepository = {
  findByUser(userId: number): CatalogMediaItem[] {
    return getDb().prepare(`
      SELECT m.*, uc.added_at,
        (SELECT MAX(wp.updated_at) FROM watch_progress wp
         WHERE wp.user_id = uc.user_id
         AND (wp.media_id = m.id OR wp.episode_id IN (SELECT e.id FROM episodes e WHERE e.media_id = m.id))
        ) as last_watched_at
      FROM user_catalog uc
      JOIN media m ON m.id = uc.media_id
      WHERE uc.user_id = ?
      ORDER BY
        COALESCE(
          (SELECT MAX(wp.updated_at) FROM watch_progress wp
           WHERE wp.user_id = uc.user_id
           AND (wp.media_id = m.id OR wp.episode_id IN (SELECT e.id FROM episodes e WHERE e.media_id = m.id))
          ),
          uc.added_at
        ) DESC
    `).all(userId) as CatalogMediaItem[];
  },

  addToCatalog(userId: number, mediaId: number): void {
    getDb().prepare(
      'INSERT OR IGNORE INTO user_catalog (user_id, media_id) VALUES (?, ?)'
    ).run(userId, mediaId);
  },

  removeFromCatalog(userId: number, mediaId: number): void {
    getDb().prepare(
      'DELETE FROM user_catalog WHERE user_id = ? AND media_id = ?'
    ).run(userId, mediaId);
  },

  isInCatalog(userId: number, mediaId: number): boolean {
    const result = getDb().prepare(
      'SELECT id FROM user_catalog WHERE user_id = ? AND media_id = ?'
    ).get(userId, mediaId);
    return !!result;
  },

  getUsersWithMedia(mediaId: number): number[] {
    const rows = getDb().prepare(
      'SELECT user_id FROM user_catalog WHERE media_id = ?'
    ).all(mediaId) as { user_id: number }[];
    return rows.map(r => r.user_id);
  },
};
