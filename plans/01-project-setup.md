# Plan 01: Project Setup & Configuration

## Objective
Initialize the monorepo structure with backend (Fastify + Node.js) and frontend (Angular + PrimeNG) projects, configure environment variables, and set up build tooling.

## Tasks

### 1.1 Initialize Backend
- Create `backend/` directory with `package.json`
- Install dependencies: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/static`, `better-sqlite3`, `bcrypt`, `webtorrent`, `dotenv`, `uuid`
- Install dev dependencies: `typescript`, `tsx`, `@types/node`, `@types/better-sqlite3`, `@types/bcrypt`
- Configure `tsconfig.json` for Node.js

### 1.2 Initialize Frontend
- Create Angular project using `ng new` in `frontend/` directory (standalone components, no SSR)
- Install PrimeNG, `@ngrx/signals`, `video.js`
- Configure PrimeNG theme and styles

### 1.3 Environment Configuration
- Create `.env.example` with all required environment variables
- Create `.env` with default development values
- Add `.env` to `.gitignore`

### 1.4 Project Root Config
- Create root `package.json` with workspace scripts
- Create `.gitignore` covering node_modules, dist, .env, sqlite files
- Create basic `README.md`

## Success Criteria
- `npm install` works in both backend and frontend
- Backend compiles TypeScript without errors
- Frontend serves with `ng serve` without errors
- All environment variables documented
