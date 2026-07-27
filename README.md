# LetsFlix

Self-hosted, multi-user streaming application designed for low-resource Linux VPS environments.

## Features

- Multi-user authentication with JWT
- TMDB metadata integration
- Automated torrent downloading via WebTorrent
- Subtitle fetching and management
- Real-time download progress via SSE
- Video playback with HTTP Range Request support
- Smart storage management

## Tech Stack

- **Frontend:** Angular + PrimeNG + Signal Stores
- **Backend:** Node.js + Fastify
- **Database:** SQLite
- **Torrent Engine:** WebTorrent

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Configuration

Copy `.env.example` to `.env` and configure your API keys:

```bash
cp .env.example .env
```

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
- You will be prompted to change password on first login.
