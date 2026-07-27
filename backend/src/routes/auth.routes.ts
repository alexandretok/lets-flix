import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { usersRepository } from '../repositories/users.repository.js';
import { authenticate } from '../plugins/auth.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const user = usersRepository.findByUsername(username);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
      requires_password_change: !!user.requires_password_change,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        requires_password_change: !!user.requires_password_change,
      },
    };
  });

  app.post('/api/auth/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const { newPassword } = request.body as { newPassword: string };

    if (!newPassword || newPassword.length < 4) {
      return reply.status(400).send({ error: 'Password must be at least 4 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    usersRepository.updatePassword(request.user.userId, hash);

    const token = app.jwt.sign({
      userId: request.user.userId,
      username: request.user.username,
      role: request.user.role,
      requires_password_change: false,
    });

    return { token, message: 'Password changed successfully' };
  });
}
