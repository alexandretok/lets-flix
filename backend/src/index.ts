import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { getDb } from './database/init.js';
import { authRoutes } from './routes/auth.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { catalogRoutes } from './routes/catalog.routes.js';
import { downloadRoutes } from './routes/download.routes.js';
import { subtitlesRoutes } from './routes/subtitles.routes.js';
import { eventsRoutes } from './routes/events.routes.js';
import { storageRoutes } from './routes/storage.routes.js';
import { streamRoutes } from './routes/stream.routes.js';
import { progressRoutes } from './routes/progress.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { downloadService } from './services/download.service.js';
import { subtitlesService } from './services/subtitles.service.js';
import { sseService } from './services/sse.service.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.jwtSecret });

// Initialize database
getDb();
console.log('Database initialized successfully');

// Initialize download service
await downloadService.initialize();
await downloadService.resumeDownloads();

// Wire download progress to SSE
downloadService.on('progress', (data) => {
  sseService.broadcast('download-progress', data);
});

// Auto-download subtitles on download completion
downloadService.on('complete', async ({ mediaId, episodeId }) => {
  try {
    await subtitlesService.autoDownloadSubtitles(mediaId, episodeId);
  } catch (error) {
    console.error('Auto subtitle download failed:', error);
  }
});

// Register routes
await app.register(authRoutes);
await app.register(usersRoutes);
await app.register(catalogRoutes);
await app.register(downloadRoutes);
await app.register(subtitlesRoutes);
await app.register(eventsRoutes);
await app.register(storageRoutes);
await app.register(streamRoutes);
await app.register(progressRoutes);
await app.register(settingsRoutes);

app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`LetsFlix backend running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
