# Plan 06: Subtitles Management (with Mocks)

## Objective
Implement OpenSubtitles integration for automatic and on-demand subtitle downloading, SRT to VTT conversion, and subtitle tracking.

## Tasks

### 6.1 OpenSubtitles Service (with Mocks)
- Create `backend/src/services/subtitles.service.ts`
- Implement `searchSubtitles(tmdbId, language, type, season?, episode?)` method
- Implement `downloadSubtitle(fileId)` method
- Create `backend/src/mocks/subtitles.mock.ts` with mock subtitle results and sample SRT content
- Toggle via `USE_MOCKS=true` env variable

### 6.2 SRT to VTT Conversion
- Implement converter utility in `backend/src/utils/srt-to-vtt.ts`
- Parse SRT format, convert timestamps, output VTT format
- Save VTT files in the same nested folder as the video file

### 6.3 Auto-Download on Completion
- When a download completes (100%), automatically fetch subtitles for configured languages
- Read `subtitle_language` from Settings table
- Download and convert each language

### 6.4 On-Demand Subtitle Routes
- `GET /api/subtitles/search?mediaId=...&language=...` - Search available subtitles
- `POST /api/subtitles/download` - Download specific subtitle file
- `GET /api/subtitles/:mediaId` - Get all downloaded subtitles for a media

### 6.5 Database Tracking
- Insert records into Subtitles table with language_code and disk_path
- Support multiple subtitles per media/episode

## Success Criteria
- Subtitles are auto-downloaded after video download completes
- SRT files are correctly converted to VTT
- Multiple languages can coexist for same media
- On-demand search and download works
- Mock mode provides testable responses
