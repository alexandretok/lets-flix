# Plan 04: TMDB Integration (with Mocks)

## Objective
Implement TMDB API integration for fetching movie/series metadata, with mock responses for development/testing.

## Tasks

### 4.1 TMDB Service
- Create `backend/src/services/tmdb.service.ts`
- Implement methods: `searchMulti(query)`, `getMovieDetails(tmdbId)`, `getSeriesDetails(tmdbId)`, `getSeasonDetails(tmdbId, seasonNumber)`
- Use TMDB API v3 endpoints

### 4.2 Mock TMDB Responses
- Create `backend/src/mocks/tmdb.mock.ts`
- Mock search results (mix of movies and series)
- Mock movie details (with duration, poster, overview)
- Mock series details (with seasons and episodes)
- Toggle mock mode via `USE_MOCKS=true` environment variable

### 4.3 Catalog Routes
- `GET /api/search?query=...` - Search TMDB for movies/series
- `POST /api/catalog/add` - Add media to user's catalog (creates Media record if not exists, creates UserCatalog link)
- `GET /api/catalog` - Get current user's catalog
- `DELETE /api/catalog/:mediaId` - Remove from user's catalog
- `GET /api/media/:id` - Get media details (includes episodes for series)

### 4.4 Series Episode Selection
- `POST /api/catalog/add-series` - Accepts tmdbId + selected episodes/seasons
- Creates Media + Episodes records for selected items only
- Returns created media with episode list

## Success Criteria
- Search returns TMDB results (or mock data)
- Adding media creates proper DB records
- User catalog is isolated per user
- Series can be added with selective episodes
- Mock mode works without real API key
