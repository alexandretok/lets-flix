import { getDb } from '../database/init.js';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  requires_password_change: number;
  created_at: string;
}

export type UserPublic = Omit<User, 'password_hash'>;

export const usersRepository = {
  findById(id: number): User | undefined {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  },

  findByUsername(username: string): User | undefined {
    return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  },

  findAll(): UserPublic[] {
    return getDb().prepare('SELECT id, username, role, requires_password_change, created_at FROM users').all() as UserPublic[];
  },

  create(username: string, passwordHash: string, role: 'admin' | 'user' = 'user'): UserPublic {
    const result = getDb().prepare(
      'INSERT INTO users (username, password_hash, role, requires_password_change) VALUES (?, ?, ?, 1)'
    ).run(username, passwordHash, role);
    return { id: result.lastInsertRowid as number, username, role, requires_password_change: 1, created_at: new Date().toISOString() };
  },

  updatePassword(id: number, passwordHash: string): void {
    getDb().prepare('UPDATE users SET password_hash = ?, requires_password_change = 0 WHERE id = ?').run(passwordHash, id);
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  },
};
