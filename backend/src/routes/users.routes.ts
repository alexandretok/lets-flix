import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { usersRepository } from '../repositories/users.repository.js';
import { authenticate, requirePasswordChanged, requireAdmin } from '../plugins/auth.js';

function generatePassword(): string {
  return crypto.randomBytes(6).toString('base64url');
}

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);
  app.addHook('preHandler', requireAdmin);

  app.get('/api/users', async () => {
    return usersRepository.findAll();
  });

  app.post('/api/users', async (request, reply) => {
    const { username, role } = request.body as {
      username: string;
      role?: 'admin' | 'user';
    };

    if (!username) {
      return reply.status(400).send({ error: 'Username is required' });
    }

    const existing = usersRepository.findByUsername(username);
    if (existing) {
      return reply.status(409).send({ error: 'Username already exists' });
    }

    const tempPassword = generatePassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    const user = usersRepository.create(username, hash, role || 'user');
    return reply.status(201).send({ ...user, tempPassword });
  });

  app.post('/api/users/:id/reset-password', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    const user = usersRepository.findById(userId);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const tempPassword = generatePassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    usersRepository.resetPassword(userId, hash);

    return { tempPassword };
  });

  app.delete('/api/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    if (userId === request.user.userId) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }

    const user = usersRepository.findById(userId);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    usersRepository.delete(userId);
    return { message: 'User deleted' };
  });
}
