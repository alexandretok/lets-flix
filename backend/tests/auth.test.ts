import { describe, it, expect } from 'vitest';
import { buildApp, getAuthToken, getAuthTokenAfterPasswordChange } from './helpers/app.js';

describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'admin', password: 'admin' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.token).toBeDefined();
      expect(body.user.username).toBe('admin');
      expect(body.user.role).toBe('admin');
      expect(body.user.requires_password_change).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'admin', password: 'wrongpass' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'noone', password: 'pass' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject empty credentials', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: '', password: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password and clear requires_password_change flag', async () => {
      const app = await buildApp();
      const token = await getAuthToken(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: `Bearer ${token}` },
        payload: { newPassword: 'newpass123' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.token).toBeDefined();
      expect(body.message).toBe('Password changed successfully');

      // Verify new password works
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'admin', password: 'newpass123' },
      });
      const loginBody = JSON.parse(loginRes.body);
      expect(loginBody.user.requires_password_change).toBe(false);
    });

    it('should reject short passwords', async () => {
      const app = await buildApp();
      const token = await getAuthToken(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: `Bearer ${token}` },
        payload: { newPassword: 'ab' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        payload: { newPassword: 'newpass123' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Password change requirement', () => {
    it('should block protected routes when password change required', async () => {
      const app = await buildApp();
      const token = await getAuthToken(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/catalog',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });

    it('should allow access after password change', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/catalog',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
