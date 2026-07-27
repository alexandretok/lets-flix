import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from '../../src/routes/auth.routes.js';
import { usersRoutes } from '../../src/routes/users.routes.js';
import { catalogRoutes } from '../../src/routes/catalog.routes.js';
import { downloadRoutes } from '../../src/routes/download.routes.js';
import { subtitlesRoutes } from '../../src/routes/subtitles.routes.js';
import { settingsRoutes } from '../../src/routes/settings.routes.js';
import { progressRoutes } from '../../src/routes/progress.routes.js';
import { storageRoutes } from '../../src/routes/storage.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: 'test_secret' });

  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(catalogRoutes);
  await app.register(downloadRoutes);
  await app.register(subtitlesRoutes);
  await app.register(settingsRoutes);
  await app.register(progressRoutes);
  await app.register(storageRoutes);

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.ready();
  return app;
}

export async function getAuthToken(app: any, username = 'admin', password = 'admin'): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username, password },
  });
  const body = JSON.parse(res.body);
  return body.token;
}

export async function getAuthTokenAfterPasswordChange(app: any): Promise<string> {
  const token = await getAuthToken(app);

  await app.inject({
    method: 'POST',
    url: '/api/auth/change-password',
    headers: { authorization: `Bearer ${token}` },
    payload: { newPassword: 'newpass123' },
  });

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'admin', password: 'newpass123' },
  });
  return JSON.parse(res.body).token;
}
