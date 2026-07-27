# Plan 11: Frontend Video Player & Settings

## Objective
Implement video.js player with subtitle tracks, watch progress, settings page, and user management page.

## Tasks

### 11.1 Video Player Page (`/watch/:id`)
- Integrate video.js player
- Source: `/api/stream/:mediaId` or `/api/stream/episode/:episodeId`
- Load all available VTT subtitle tracks from API
- Send heartbeat every 10s to save progress
- Resume from last `stopped_at_seconds` position

### 11.2 Watch Progress Integration
- On video timeupdate (throttled), send progress to backend
- Display resume prompt if previous progress exists
- Update catalog status when video completes (90% rule)

### 11.3 Settings Page (`/settings`)
- Subtitle language preference (multi-select dropdown)
- Allowed resolutions (multi-select: 720p, 1080p, 2160p)
- Auto-delete after watching toggle
- Save settings to backend

### 11.4 Users Page (`/users`) - Admin Only
- List all users in table
- Create new user form (username + temporary password)
- Delete user button with confirmation
- Protected by admin role guard

### 11.5 Storage Indicator
- Sidebar disk usage bar
- Red styling if > 80%
- Refresh periodically

## Success Criteria
- Video plays with seeking support
- Subtitles are selectable in player
- Watch progress saves and resumes
- Settings persist correctly
- Admin can manage users
- Storage indicator reflects real usage
