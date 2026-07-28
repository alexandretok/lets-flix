import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged, requireAdmin } from '../plugins/auth.js';
import { downloadService } from '../services/download.service.js';

export async function torrentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);
  app.addHook('preHandler', requireAdmin);

  app.get('/api/torrents', async () => {
    return { torrents: downloadService.getAllTorrents() };
  });

  app.post('/api/torrents/:infoHash/pause', async (request, reply) => {
    const { infoHash } = request.params as { infoHash: string };
    const success = downloadService.pauseTorrent(infoHash);
    if (!success) {
      return reply.status(404).send({ error: 'Torrent not found or not pausable' });
    }
    return { message: 'Torrent paused' };
  });

  app.post('/api/torrents/:infoHash/resume', async (request, reply) => {
    const { infoHash } = request.params as { infoHash: string };
    const success = downloadService.resumeTorrent(infoHash);
    if (!success) {
      return reply.status(404).send({ error: 'Torrent not found' });
    }
    return { message: 'Torrent resumed' };
  });

  app.post('/api/torrents/:infoHash/remove', async (request, reply) => {
    const { infoHash } = request.params as { infoHash: string };
    const success = downloadService.removeTorrent(infoHash);
    if (!success) {
      return reply.status(404).send({ error: 'Torrent not found' });
    }
    return { message: 'Torrent removed' };
  });

  app.post('/api/torrents/delete-file', async (request, reply) => {
    const { key } = request.body as { key: string };
    if (!key) {
      return reply.status(400).send({ error: 'key is required' });
    }
    const result = downloadService.deleteFile(key);
    if (!result.success) {
      return reply.status(400).send({ error: result.message });
    }
    return result;
  });
}
