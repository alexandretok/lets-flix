import { describe, it, expect } from 'vitest';
import { buildApp, getAuthTokenAfterPasswordChange } from './helpers/app.js';

describe('User Management', () => {
  describe('GET /api/users', () => {
    it('should list users for admin', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const users = JSON.parse(res.body);
      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(users[0].username).toBe('admin');
      expect(users[0].password_hash).toBeUndefined();
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${token}` },
        payload: { username: 'testuser', password: 'testpass', role: 'user' },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.username).toBe('testuser');
      expect(body.role).toBe('user');
      expect(body.requires_password_change).toBe(1);
    });

    it('should reject duplicate username', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${token}` },
        payload: { username: 'testuser', password: 'testpass', role: 'user' },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${token}` },
        payload: { username: 'testuser', password: 'testpass2', role: 'user' },
      });

      expect(res.statusCode).toBe(409);
    });

    it('should reject non-admin creating users', async () => {
      const app = await buildApp();
      const adminToken = await getAuthTokenAfterPasswordChange(app);

      // Create a regular user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { username: 'regular', password: 'pass123', role: 'user' },
      });

      // Login as regular user and change password
      let res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'regular', password: 'pass123' },
      });
      const regToken = JSON.parse(res.body).token;
      res = await app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { authorization: `Bearer ${regToken}` },
        payload: { newPassword: 'newpass' },
      });
      const newToken = JSON.parse(res.body).token;

      // Try to create user as regular
      res = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${newToken}` },
        payload: { username: 'another', password: 'pass', role: 'user' },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      // Create user
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: { authorization: `Bearer ${token}` },
        payload: { username: 'todelete', password: 'pass', role: 'user' },
      });
      const userId = JSON.parse(createRes.body).id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/users/${userId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should not allow deleting yourself', async () => {
      const app = await buildApp();
      const token = await getAuthTokenAfterPasswordChange(app);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/users/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
