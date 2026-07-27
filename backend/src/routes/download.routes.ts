import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { downloadService } from '../services/download.service.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';

export async function downloadRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.post('/api/download/start/:mediaId', async (request, reply) => {
    const { mediaId } = request.params as { mediaId: string };
    const { episodeId } = request.body as { episodeId?: number };
    const id = parseInt(mediaId, 10);

    const media = mediaRepository.findById(id);
    if (!media) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    const result = await downloadService.startDownload(id, episodeId);
    if (!result.success) {
      return reply.status(400).send({ error: result.message });
    }

    return result;
  });

  app.post('/api/download/retry/:mediaId', async (request, reply) => {
    const { mediaId } = request.params as { mediaId: string };
    const { episodeId } = request.body as { episodeId?: number };
    const id = parseInt(mediaId, 10);

    const media = mediaRepository.findById(id);
    if (!media) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    if (episodeId) {
      const episode = episodesRepository.findById(episodeId);
      if (!episode || episode.status !== 'not_found') {
        return reply.status(400).send({ error: 'Episode not in not_found status' });
      }
      episodesRepository.updateStatus(episodeId, 'pending');
    } else {
      if (media.status !== 'not_found') {
        return reply.status(400).send({ error: 'Media not in not_found status' });
      }
      mediaRepository.updateStatus(id, 'pending');
    }

    const result = await downloadService.startDownload(id, episodeId);
    return result;
  });

  app.get('/api/download/status', async () => {
    return { downloads: downloadService.getActiveDownloads() };
  });
}
