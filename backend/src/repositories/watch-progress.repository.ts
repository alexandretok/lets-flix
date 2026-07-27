import { getDb } from '../database/init.js';

export interface WatchProgress {
  id: number;
  user_id: number;
  media_id: number | null;
  episode_id: number | null;
  stopped_at_seconds: number;
  is_watched: number;
  updated_at: string;
}

export const watchProgressRepository = {
  findByUserAndMedia(userId: number, mediaId: number): WatchProgress | undefined {
    return getDb().prepare(
      'SELECT * FROM watch_progress WHERE user_id = ? AND media_id = ? AND episode_id IS NULL'
    ).get(userId, mediaId) as WatchProgress | undefined;
  },

  findByUserAndEpisode(userId: number, episodeId: number): WatchProgress | undefined {
    return getDb().prepare(
      'SELECT * FROM watch_progress WHERE user_id = ? AND episode_id = ?'
    ).get(userId, episodeId) as WatchProgress | undefined;
  },

  upsert(data: { user_id: number; media_id?: number; episode_id?: number; stopped_at_seconds: number; is_watched?: boolean }): void {
    const isWatched = data.is_watched ? 1 : 0;
    const mediaId = data.media_id || null;
    const episodeId = data.episode_id || null;

    // SQLite treats NULLs as distinct in UNIQUE constraints, so use a manual check
    let existing: WatchProgress | undefined;
    if (episodeId) {
      existing = this.findByUserAndEpisode(data.user_id, episodeId);
    } else if (mediaId) {
      existing = this.findByUserAndMedia(data.user_id, mediaId);
    }

    if (existing) {
      getDb().prepare(`
        UPDATE watch_progress SET stopped_at_seconds = ?, is_watched = ?, updated_at = datetime('now') WHERE id = ?
      `).run(data.stopped_at_seconds, isWatched, existing.id);
    } else {
      getDb().prepare(`
        INSERT INTO watch_progress (user_id, media_id, episode_id, stopped_at_seconds, is_watched, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(data.user_id, mediaId, episodeId, data.stopped_at_seconds, isWatched);
    }
  },

  isWatchedByAllUsers(mediaId: number): boolean {
    const result = getDb().prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN wp.is_watched = 1 THEN 1 ELSE 0 END) as watched
      FROM user_catalog uc
      LEFT JOIN watch_progress wp ON wp.user_id = uc.user_id AND wp.media_id = uc.media_id
      WHERE uc.media_id = ?
    `).get(mediaId) as { total: number; watched: number };
    return result.total > 0 && result.total === result.watched;
  },

  getUnwatchedMediaOldest(): { media_id: number; downloaded_at: string }[] {
    return getDb().prepare(`
      SELECT m.id as media_id, m.downloaded_at
      FROM media m
      WHERE m.status = 'downloaded'
      AND NOT EXISTS (
        SELECT 1 FROM watch_progress wp WHERE wp.media_id = m.id AND wp.is_watched = 1
      )
      ORDER BY m.downloaded_at ASC
    `).all() as { media_id: number; downloaded_at: string }[];
  },

  getWatchedMediaOldest(): { media_id: number; downloaded_at: string }[] {
    return getDb().prepare(`
      SELECT m.id as media_id, m.downloaded_at
      FROM media m
      WHERE m.status = 'downloaded'
      AND EXISTS (
        SELECT 1 FROM watch_progress wp WHERE wp.media_id = m.id AND wp.is_watched = 1
      )
      ORDER BY m.downloaded_at ASC
    `).all() as { media_id: number; downloaded_at: string }[];
  },
};
