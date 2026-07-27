# Plan 05: Torrent Search & Download Engine (with Mocks)

## Objective
Implement torrent search via indexer (Jackett/Prowlarr), WebTorrent download engine, deduplication logic, and storage safeguards.

## Tasks

### 5.1 Indexer Service (with Mocks)
- Create `backend/src/services/indexer.service.ts`
- Implement `searchTorrents(title, year, type, resolution)` method
- Build search query with codec filters (x264, H.264, mp4) and resolution from settings
- Create `backend/src/mocks/indexer.mock.ts` with mock torrent results
- Return sorted results by seeders

### 5.2 WebTorrent Download Service
- Create `backend/src/services/download.service.ts`
- Initialize WebTorrent client
- Implement `startDownload(magnetUri, destinationPath)` method
- Track progress and emit events
- Enforce nested storage structure:
  - Movies: `/downloads/movies/[Movie Title (Year)]/`
  - Series: `/downloads/series/[Series Title]/season-[XX]/episode-[XX]/`

### 5.3 Deduplication Logic
- Before downloading, check if media already exists with status `downloaded` or `downloading`
- If exists, link user to existing media instead of new download
- Update status appropriately

### 5.4 Storage Safeguards (95% limit)
- Create `backend/src/services/storage.service.ts`
- Implement disk usage check before downloads
- Implement smart deletion strategy:
  - Phase 1: Files watched by ALL users
  - Phase 2: Oldest never-watched files
  - Phase 3: Oldest watched files
- Revert deleted files' status to `pending` in DB

### 5.5 Download Routes
- `POST /api/download/start/:mediaId` - Trigger download for media/episode
- `POST /api/download/retry/:mediaId` - Retry search for not_found media
- `GET /api/download/status` - Get all active downloads

### 5.6 Startup Recovery
- On backend start, query for media in `downloading` state
- Verify partial files on disk
- Re-initialize in WebTorrent to resume

## Success Criteria
- Torrent search returns filtered results (or mocks)
- Downloads use correct nested folder structure
- Deduplication prevents redundant downloads
- Storage limit check works before download starts
- Recovery routine resumes interrupted downloads
