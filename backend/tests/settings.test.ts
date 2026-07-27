import { describe, it, expect } from 'vitest';
import { buildApp, getAuthTokenAfterPasswordChange } from './helpers/app.js';

describe('Settings', () => {
  describe('GET /api/settings', () => {
    it('should return all settings', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/settings',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.settings.subtitle_language).toEqual(['en']);
      expect(body.settings.allowed_resolutions).toEqual(['720p', '1080p']);
      expect(body.settings.auto_delete_watched).toBe(false);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          settings: {
            subtitle_language: ['en', 'pt'],
            allowed_resolutions: ['1080p', '2160p'],
            auto_delete_watched: 'true',
          },
        },
      });

      expect(res.statusCode).toBe(200);

      // Verify the update
      const getRes = await app.inject({
        method: 'GET',
        url: '/api/settings',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(getRes.body);
      expect(body.settings.subtitle_language).toEqual(['en', 'pt']);
      expect(body.settings.allowed_resolutions).toEqual(['1080p', '2160p']);
      expect(body.settings.auto_delete_watched).toBe(true);
    });
  });
});
