# Plan 07: SSE Real-time & Storage Management

## Objective
Implement Server-Sent Events for real-time download progress broadcasting and storage management UI data endpoints.

## Tasks

### 7.1 SSE Endpoint
- Create `GET /api/events` SSE endpoint
- Broadcast download progress: `{ mediaId, progress, downloadSpeed, status }`
- Support per-user connections (filter events by user catalog)
- Handle client disconnection gracefully

### 7.2 Download Progress Broadcasting
- Integrate WebTorrent progress events with SSE
- Emit events on: download start, progress update (throttled to every 2s), download complete, download error

### 7.3 Storage Management Routes
- `GET /api/storage/status` - Return disk usage (total, used, free, percentage)
- `DELETE /api/storage/media/:id` - Manually delete a media file (with safe deletion check)
- Implement catalog link counting for safe deletion

### 7.4 Auto-Delete on Watch
- When `is_watched` becomes true and `auto_delete_watched` setting is enabled
- Check if all users who have the media marked it as watched
- If safe to delete, mark for deletion

### 7.5 Storage UI Data
- Include disk usage percentage in storage status response
- Return warning flag if usage > 80%

## Success Criteria
- SSE connection streams real-time progress
- Download events are properly broadcast
- Disk usage is accurately reported
- Safe deletion respects multi-user catalog links
- Auto-delete works when configured
