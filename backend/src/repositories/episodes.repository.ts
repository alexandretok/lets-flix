import { getDb } from '../database/init.js';

export interface Episode {
  id: number;
  media_id: number;
  season_number: number;
  episode_number: number;
  title: string | null;
  status: 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
  disk_path: string | null;
  downloaded_at: string | null;
  created_at: string;
}

export const episodesRepository = {
  findById(id: number): Episode | undefined {
    return getDb().prepare('SELECT * FROM episodes WHERE id = ?').get(id) as Episode | undefined;
  },

  findByMediaId(mediaId: number): Episode[] {
    return getDb().prepare(
      'SELECT * FROM episodes WHERE media_id = ? ORDER BY season_number, episode_number'
    ).all(mediaId) as Episode[];
  },

  findByStatus(status: string): Episode[] {
    return getDb().prepare('SELECT * FROM episodes WHERE status = ?').all(status) as Episode[];
  },

  create(data: { media_id: number; season_number: number; episode_number: number; title?: string }): Episode {
    const result = getDb().prepare(
      'INSERT OR IGNORE INTO episodes (media_id, season_number, episode_number, title) VALUES (?, ?, ?, ?)'
    ).run(data.media_id, data.season_number, data.episode_number, data.title || null);
    return getDb().prepare(
      'SELECT * FROM episodes WHERE media_id = ? AND season_number = ? AND episode_number = ?'
    ).get(data.media_id, data.season_number, data.episode_number) as Episode;
  },

  updateStatus(id: number, status: Episode['status'], diskPath?: string): void {
    if (diskPath) {
      getDb().prepare('UPDATE episodes SET status = ?, disk_path = ?, downloaded_at = datetime(\'now\') WHERE id = ?').run(status, diskPath, id);
    } else {
      getDb().prepare('UPDATE episodes SET status = ? WHERE id = ?').run(status, id);
    }
  },

  createBatch(episodes: { media_id: number; season_number: number; episode_number: number; title?: string }[]): Episode[] {
    const insert = getDb().prepare(
      'INSERT OR IGNORE INTO episodes (media_id, season_number, episode_number, title) VALUES (?, ?, ?, ?)'
    );
    const transaction = getDb().transaction((items: typeof episodes) => {
      for (const ep of items) {
        insert.run(ep.media_id, ep.season_number, ep.episode_number, ep.title || null);
      }
    });
    transaction(episodes);
    if (episodes.length === 0) return [];
    return this.findByMediaId(episodes[0].media_id);
  },

  deleteById(id: number): void {
    getDb().prepare('DELETE FROM episodes WHERE id = ?').run(id);
  },

  deleteByMediaId(mediaId: number): void {
    getDb().prepare('DELETE FROM episodes WHERE media_id = ?').run(mediaId);
  },
};
