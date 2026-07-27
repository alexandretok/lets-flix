import { describe, it, expect } from 'vitest';
import { buildApp, getAuthTokenAfterPasswordChange } from './helpers/app.js';

describe('Catalog & TMDB', () => {
  describe('GET /api/search', () => {
    it('should search TMDB with mock results', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/search?query=fight',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.results).toBeDefined();
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].title).toBe('Fight Club');
    });

    it('should return empty for non-matching query', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/search?query=zzzznonexistent',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.results).toHaveLength(0);
    });

    it('should return empty for empty query', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/search?query=',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.results).toHaveLength(0);
    });
  });

  describe('POST /api/catalog/add', () => {
    it('should add a movie to catalog', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/catalog/add',
        headers: { authorization: `Bearer ${token}` },
        payload: { tmdb_id: 550, type: 'movie' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.media.title).toBe('Fight Club');
      expect(body.media.status).toBe('pending');
      expect(body.media.duration).toBe(8340);
    });

    it('should deduplicate when adding same media twice', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      await app.inject({
        method: 'POST',
        url: '/api/catalog/add',
        headers: { authorization: `Bearer ${token}` },
        payload: { tmdb_id: 550, type: 'movie' },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/catalog/add',
        headers: { authorization: `Bearer ${token}` },
        payload: { tmdb_id: 550, type: 'movie' },
      });

      expect(res.statusCode).toBe(200);
      // Should reuse same media ID
      const body = JSON.parse(res.body);
      expect(body.media.id).toBe(1);
    });
  });

  describe('POST /api/catalog/add-series', () => {
    it('should add series with selected episodes', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/catalog/add-series',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          tmdb_id: 1396,
          selected_episodes: [
            { season: 1, episode: 1, title: 'Pilot' },
            { season: 1, episode: 2, title: 'Episode 2' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.media.type).toBe('series');
      expect(body.episodes).toHaveLength(2);
      expect(body.episodes[0].season_number).toBe(1);
      expect(body.episodes[0].episode_number).toBe(1);
    });
  });

  describe('GET /api/catalog', () => {
    it('should return user catalog', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      await app.inject({
        method: 'POST',
        url: '/api/catalog/add',
        headers: { authorization: `Bearer ${token}` },
        payload: { tmdb_id: 550, type: 'movie' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/catalog',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.catalog).toHaveLength(1);
      expect(body.catalog[0].title).toBe('Fight Club');
    });
  });

  describe('DELETE /api/catalog/:mediaId', () => {
    it('should remove media from catalog', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      await app.inject({
        method: 'POST',
        url: '/api/catalog/add',
        headers: { authorization: `Bearer ${token}` },
        payload: { tmdb_id: 550, type: 'movie' },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/catalog/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);

      const catalogRes = await app.inject({
        method: 'GET',
        url: '/api/catalog',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(JSON.parse(catalogRes.body).catalog).toHaveLength(0);
    });
  });
});
