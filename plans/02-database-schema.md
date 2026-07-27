# Plan 02: Database Schema & Models

## Objective
Define the SQLite database schema, create migration/initialization scripts, and build data access layer.

## Tasks

### 2.1 Database Initialization
- Create `backend/src/database/init.ts` to initialize SQLite with `better-sqlite3`
- Create schema with all tables from the spec
- Implement auto-migration on startup

### 2.2 Schema Tables
- `Users`: id, username, password_hash, role (admin/user), requires_password_change (boolean)
- `Media`: id, tmdb_id, type (movie/series), title, poster_url, overview, status (pending/searching/downloading/downloaded/not_found), disk_path, duration, downloaded_at
- `UserCatalog`: user_id, media_id, added_at
- `Episodes`: id, media_id, season_number, episode_number, title, status (pending/searching/downloading/downloaded/not_found), disk_path, downloaded_at
- `Subtitles`: id, media_id (nullable), episode_id (nullable), language_code, disk_path
- `WatchProgress`: id, user_id, media_id (nullable), episode_id (nullable), stopped_at_seconds, is_watched (boolean), updated_at
- `Settings`: key, value (stored as text, supports JSON)

### 2.3 Admin Seeding
- On first run, create admin user with username `admin` and bcrypt-hashed password `admin`
- Set `requires_password_change = true`

### 2.4 Default Settings
- Seed default settings: `subtitle_language` = `["en"]`, `auto_delete_watched` = `false`, `allowed_resolutions` = `["720p", "1080p"]`

### 2.5 Repository Layer
- Create repository files for each entity with CRUD operations
- Use prepared statements for performance

## Success Criteria
- Database file is created on first startup
- All tables exist with correct schema
- Admin user is seeded correctly
- Settings are pre-populated
