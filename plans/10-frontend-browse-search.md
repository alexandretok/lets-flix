# Plan 10: Frontend Browse, Search & Content Details

## Objective
Implement the main content browsing pages: catalog view, search, and content details with episode selection.

## Tasks

### 10.1 Layout Component
- App shell with PrimeNG Sidebar navigation
- Disk usage indicator in sidebar (red if > 80%)
- Navigation links: Browse, Search, Settings, Users (admin only)
- User info and logout button

### 10.2 Browse Page (`/browse`)
- Display user's catalog using PrimeNG DataView
- Show poster, title, status badge
- Grid/list view toggle
- Click navigates to content details

### 10.3 Search Page (`/search`)
- Search input with debounce
- Display TMDB results
- "Add to Catalog" button per result
- For series: open Dialog with season/episode tree selection
- PrimeNG Toast on successful add

### 10.4 Content Details Page (`/browse/:id`)
- Media poster, title, overview, status
- For series: episode list grouped by season with individual status
- "Retry Torrent Search" button (visible if status is `not_found`)
- Download progress bar (PrimeNG ProgressBar) for downloading items
- Subtitle downloader component (language dropdown + download button)
- Play button (disabled unless status is `downloaded`)

### 10.5 Catalog Store
- Signal Store for catalog state
- Actions: loadCatalog, addMedia, removeMedia, searchTMDB
- Real-time status updates via SSE integration

### 10.6 SSE Service
- Angular service connecting to `/api/events`
- Parse SSE messages and update relevant stores

## Success Criteria
- User can browse their catalog
- Search returns and displays TMDB results
- Series can be added with selective episodes
- Content details shows full info with status
- Real-time updates work via SSE
