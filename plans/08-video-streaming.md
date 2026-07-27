# Plan 08: Video Streaming Backend

## Objective
Implement HTTP Range Request support for video streaming and watch progress tracking.

## Tasks

### 8.1 Video Streaming Route
- `GET /api/stream/:mediaId` - Stream video file with Range Request support
- `GET /api/stream/episode/:episodeId` - Stream episode file
- Parse `Range` header, return 206 Partial Content
- Set correct content-type headers for video files
- Only serve files with status `downloaded`

### 8.2 Watch Progress Routes
- `POST /api/progress` - Save watch progress heartbeat (user_id, media_id/episode_id, stopped_at_seconds)
- `GET /api/progress/:mediaId` - Get user's watch progress for media
- Throttle saves (accept every 10s from frontend)

### 8.3 Watch Completion Logic
- If `stopped_at_seconds > 90% of duration`, set `is_watched = true`
- Trigger auto-delete check if setting enabled

### 8.4 Subtitle Serving
- `GET /api/stream/subtitle/:subtitleId` - Serve VTT subtitle file
- Return with `Content-Type: text/vtt`

## Success Criteria
- Video streams correctly with seeking/scrubbing
- Range requests return proper 206 responses
- Watch progress is saved per user
- 90% completion marks as watched
- Subtitles are servable as VTT tracks
