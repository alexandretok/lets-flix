# LetsFlix

> **Note:** This project is still under active development and is not yet ready for testing or production use.

Self-hosted, multi-user streaming application designed for low-resource Linux VPS environments.

## Features

- Multi-user authentication with JWT and role-based access control
- TMDB metadata integration (search, trending, details)
- Automated torrent downloading via WebTorrent
- Subtitle fetching and management (OpenSubtitles)
- Real-time download progress via SSE
- Video playback with HTTP Range Request support
- Smart storage management with disk monitoring
- Admin panel for torrent and user management

## Tech Stack

- **Frontend:** Angular 22 + Angular Material + Signal Stores
- **Backend:** Node.js + Fastify
- **Database:** SQLite (better-sqlite3)
- **Torrent Engine:** WebTorrent

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Configuration

Copy the example environment file and configure it:

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env` with your actual values:

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: `3000`) |
| `JWT_SECRET` | Secret string for JWT token signing. Use a strong random value in production. |
| `DATABASE_URL` | SQLite database file path (default: `file:./database.sqlite`) |
| `DOWNLOAD_DIR` | Directory where downloaded media files are stored (default: `./downloads`) |
| `TMDB_API_KEY` | Your TMDB API key (see below) |
| `OPENSUBTITLES_API_KEY` | Your OpenSubtitles API key (see below) |
| `INDEXER_URL` | URL of your Jackett/Prowlarr instance (default: `http://localhost:9117`) |
| `INDEXER_API_KEY` | API key for your Jackett/Prowlarr instance |

### Obtaining API Keys

#### TMDB (The Movie Database)

TMDB provides movie and TV show metadata (titles, posters, ratings, trending content).

1. Create a free account at [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Go to **Settings > API** ([https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))
3. Request an API key — select "Developer" and fill in the application details
4. Copy the **API Key (v3 auth)** value into your `.env` file as `TMDB_API_KEY`

TMDB's API is free for non-commercial and personal use. Review their [terms of use](https://www.themoviedb.org/documentation/api/terms-of-use) for details.

#### OpenSubtitles

OpenSubtitles provides subtitle files for movies and TV episodes.

1. Create a free account at [https://www.opensubtitles.com/en/users/sign_up](https://www.opensubtitles.com/en/users/sign_up)
2. Go to **Consumers** ([https://www.opensubtitles.com/en/consumers](https://www.opensubtitles.com/en/consumers))
3. Register a new consumer/application to receive an API key
4. Copy the **API Key** into your `.env` file as `OPENSUBTITLES_API_KEY`

The free tier allows up to 20 subtitle downloads per day and 5 requests per second. See [OpenSubtitles API documentation](https://opensubtitles.stoplight.io/docs/opensubtitles-api) for rate limits and plans.

#### Jackett / Prowlarr (Indexer)

An indexer is used to search for torrent sources. Jackett and Prowlarr are the most common options.

1. Install [Jackett](https://github.com/Jackett/Jackett) or [Prowlarr](https://github.com/Prowlarr/Prowlarr) on your server
2. Configure at least one torrent indexer in the Jackett/Prowlarr UI
3. Copy the API key from the Jackett/Prowlarr dashboard into `INDEXER_API_KEY`
4. Set `INDEXER_URL` to the URL where your indexer is accessible (e.g., `http://localhost:9117`)

### Development

```bash
# Run both backend and frontend
npm run dev

# Or separately
npm run backend:dev
npm run frontend:dev
```

### Default Login

- Username: `admin`
- Password: `admin`
- You will be prompted to change the password on first login.

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Project Structure

```
lets-flix/
├── backend/          # Fastify REST API
│   ├── src/
│   │   ├── config/       # Environment config
│   │   ├── database/     # SQLite initialization
│   │   ├── plugins/      # Fastify plugins (auth)
│   │   ├── repositories/ # Data access layer
│   │   ├── routes/       # API route handlers
│   │   └── services/     # Business logic (TMDB, downloads, subtitles)
│   └── .env
├── frontend/         # Angular SPA
│   └── src/app/
│       ├── components/   # Shared components
│       ├── guards/       # Route guards
│       ├── layout/       # App shell (sidebar, storage)
│       ├── pages/        # Route pages
│       └── services/     # HTTP & auth services
└── plans/            # Development plans
```
