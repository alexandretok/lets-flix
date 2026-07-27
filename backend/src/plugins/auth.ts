import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  requires_password_change: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requirePasswordChanged(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.requires_password_change) {
    return reply.status(403).send({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}

export function registerAuthHooks(app: FastifyInstance): void {
  app.decorate('authenticate', authenticate);
  app.decorate('requirePasswordChanged', requirePasswordChanged);
  app.decorate('requireAdmin', requireAdmin);
}
