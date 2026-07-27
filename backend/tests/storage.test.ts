import { describe, it, expect } from 'vitest';
import { buildApp, getAuthTokenAfterPasswordChange } from './helpers/app.js';

describe('Storage', () => {
  describe('GET /api/storage/status', () => {
    it('should return disk usage information', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/storage/status',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.total).toBeGreaterThan(0);
      expect(body.used).toBeGreaterThanOrEqual(0);
      expect(body.free).toBeGreaterThan(0);
      expect(body.percentage).toBeGreaterThanOrEqual(0);
      expect(body.percentage).toBeLessThanOrEqual(100);
      expect(typeof body.warning).toBe('boolean');
      expect(typeof body.critical).toBe('boolean');
    });
  });
});
