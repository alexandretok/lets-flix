import { getDb } from '../database/init.js';
import { Setting } from '../types/index.js';
export type { Setting } from '../types/index.js';

export const settingsRepository = {
  get(key: string): string | undefined {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value;
  },

  getJson<T>(key: string): T | undefined {
    const value = this.get(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },

  set(key: string, value: string): void {
    getDb().prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    ).run(key, value, value);
  },

  setJson(key: string, value: unknown): void {
    this.set(key, JSON.stringify(value));
  },

  getAll(): Setting[] {
    return getDb().prepare('SELECT * FROM settings').all() as Setting[];
  },
};
