import { describe, it, expect } from 'vitest';
import { buildApp, getAuthTokenAfterPasswordChange } from './helpers/app.js';
import { getTestDb } from './setup.js';

describe('Watch Progress', () => {
  async function seedMedia(app: any, token: string) {
    await app.inject({
      method: 'POST',
      url: '/api/catalog/add',
      headers: { authorization: `Bearer ${token}` },
      payload: { tmdb_id: 550, type: 'movie' },
    });
  }

  describe('POST /api/progress', () => {
    it('should save watch progress for media', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      const res = await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 120 },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.saved).toBe(true);
      expect(body.isWatched).toBe(false);
    });

    it('should mark as watched at 90% completion', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      // Movie duration is 8340 seconds (139 min), 90% = 7506
      const res = await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 7600 },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.isWatched).toBe(true);
    });

    it('should not mark as watched before 90%', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      const res = await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 7000 },
      });

      const body = JSON.parse(res.body);
      expect(body.isWatched).toBe(false);
    });

    it('should use client duration when DB has no duration', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      // Manually set duration to null to simulate episode
      getTestDb().prepare('UPDATE media SET duration = NULL WHERE id = 1').run();

      const res = await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 95, duration: 100 },
      });

      const body = JSON.parse(res.body);
      expect(body.isWatched).toBe(true);
    });

    it('should update existing progress (upsert)', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 100 },
      });

      await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 200 },
      });

      const getRes = await app.inject({
        method: 'GET',
        url: '/api/progress/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(getRes.body);
      expect(body.progress.stopped_at_seconds).toBe(200);
    });
  });

  describe('GET /api/progress/:mediaId', () => {
    it('should return progress for a media', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      await app.inject({
        method: 'POST',
        url: '/api/progress',
        headers: { authorization: `Bearer ${token}` },
        payload: { mediaId: 1, stoppedAtSeconds: 500 },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/progress/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.progress.stopped_at_seconds).toBe(500);
    });

    it('should return null for no progress', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);
      await seedMedia(app, token);

      const res = await app.inject({
        method: 'GET',
        url: '/api/progress/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.progress).toBeNull();
    });
  });
});
