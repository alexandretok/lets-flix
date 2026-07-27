import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { settingsRepository } from '../repositories/settings.repository.js';

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.get('/api/settings', async () => {
    const all = settingsRepository.getAll();
    const settings: Record<string, any> = {};
    for (const s of all) {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    }
    return { settings };
  });

  app.put('/api/settings', async (request) => {
    const { settings } = request.body as { settings: Record<string, any> };

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'object') {
        settingsRepository.setJson(key, value);
      } else {
        settingsRepository.set(key, String(value));
      }
    }

    return { message: 'Settings updated' };
  });
}
