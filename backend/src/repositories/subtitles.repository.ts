import { getDb } from '../database/init.js';
import { Subtitle } from '../types/index.js';
export type { Subtitle } from '../types/index.js';

export const subtitlesRepository = {
  findById(id: number): Subtitle | undefined {
    return getDb().prepare('SELECT * FROM subtitles WHERE id = ?').get(id) as Subtitle | undefined;
  },

  findByMediaId(mediaId: number): Subtitle[] {
    return getDb().prepare('SELECT * FROM subtitles WHERE media_id = ?').all(mediaId) as Subtitle[];
  },

  findByEpisodeId(episodeId: number): Subtitle[] {
    return getDb().prepare('SELECT * FROM subtitles WHERE episode_id = ?').all(episodeId) as Subtitle[];
  },

  create(data: { media_id?: number; episode_id?: number; language_code: string; disk_path: string }): Subtitle {
    const result = getDb().prepare(
      'INSERT INTO subtitles (media_id, episode_id, language_code, disk_path) VALUES (?, ?, ?, ?)'
    ).run(data.media_id || null, data.episode_id || null, data.language_code, data.disk_path);
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM subtitles WHERE id = ?').run(id);
  },
};
