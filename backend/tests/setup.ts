import { vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

let testDb: Database.Database;

// Mock the database module to return our test DB
vi.mock('../src/database/init.js', () => ({
  getDb: () => testDb,
}));

// Mock env config
vi.mock('../src/config/env.js', () => ({
  config: {
    port: 3000,
    jwtSecret: 'test_secret',
    databaseUrl: 'file::memory:',
    downloadDir: '/tmp/letsflix-test-downloads',
    tmdbApiKey: 'mock_key',
    opensubtitlesApiKey: 'mock_key',
    indexerUrl: 'http://localhost:9117',
    indexerApiKey: 'mock_key',
  },
}));

export function getTestDb(): Database.Database {
  return testDb;
}

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');

  testDb.exec(`
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
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed admin user
  const hash = bcrypt.hashSync('admin', 10);
  testDb.prepare('INSERT INTO users (username, password_hash, role, requires_password_change) VALUES (?, ?, ?, ?)').run('admin', hash, 'admin', 1);

  // Seed settings
  testDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('subtitle_language', JSON.stringify(['en']));
  testDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('auto_delete_watched', 'false');
  testDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('allowed_resolutions', JSON.stringify(['720p', '1080p']));
});

afterEach(() => {
  if (testDb) {
    testDb.close();
  }
});
