import Database from 'better-sqlite3';
import { config } from '../config/env.js';
import bcrypt from 'bcrypt';

const dbPath = config.databaseUrl.replace('file:', '');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    seedDefaults();
  }
  return db;
}

function initializeSchema(): void {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      requires_password_change INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('movie', 'series')),
      title TEXT NOT NULL,
      poster_url TEXT,
      overview TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'searching', 'downloading', 'downloaded', 'not_found')),
      disk_path TEXT,
      duration INTEGER,
      downloaded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
      UNIQUE(user_id, media_id)
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL,
      season_number INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'searching', 'downloading', 'downloaded', 'not_found')),
      disk_path TEXT,
      downloaded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
      UNIQUE(media_id, season_number, episode_number)
    );

    CREATE TABLE IF NOT EXISTS subtitles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER,
      episode_id INTEGER,
      language_code TEXT NOT NULL,
      disk_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watch_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_id INTEGER,
      episode_id INTEGER,
      stopped_at_seconds REAL NOT NULL DEFAULT 0,
      is_watched INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
      UNIQUE(user_id, media_id, episode_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_catalog_user ON user_catalog(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_catalog_media ON user_catalog(media_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_media ON episodes(media_id);
    CREATE INDEX IF NOT EXISTS idx_subtitles_media ON subtitles(media_id);
    CREATE INDEX IF NOT EXISTS idx_subtitles_episode ON subtitles(episode_id);
    CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_tmdb ON media(tmdb_id);
  `);
}

function seedDefaults(): void {
  const database = db;

  const adminExists = database.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin', 10);
    database.prepare(
      'INSERT INTO users (username, password_hash, role, requires_password_change) VALUES (?, ?, ?, ?)'
    ).run('admin', hash, 'admin', 1);
  }

  const defaultSettings: Record<string, string> = {
    subtitle_language: JSON.stringify(['en']),
    auto_delete_watched: 'false',
    allowed_resolutions: JSON.stringify(['720p', '1080p']),
  };

  const insertSetting = database.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
}
