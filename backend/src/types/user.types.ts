export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  requires_password_change: number;
  created_at: string;
}

export type UserPublic = Omit<User, 'password_hash'>;

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  requires_password_change: boolean;
}
