export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
  requires_password_change: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
