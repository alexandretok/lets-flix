import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { subtitlesService } from '../services/subtitles.service.js';
import { subtitlesRepository } from '../repositories/subtitles.repository.js';
import { mediaRepository } from '../repositories/media.repository.js';

export async function subtitlesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.get('/api/subtitles/search', async (request, reply) => {
    const { mediaId, episodeId, language } = request.query as {
      mediaId?: string;
      episodeId?: string;
      language: string;
    };

    if (!language) {
      return reply.status(400).send({ error: 'language is required' });
    }

    const id = mediaId ? parseInt(mediaId, 10) : undefined;
    const media = id ? mediaRepository.findById(id) : undefined;

    if (!media) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    const results = await subtitlesService.searchSubtitles(
      media.tmdb_id,
      language,
      media.type
    );

    return { results };
  });

  app.post('/api/subtitles/download', async (request, reply) => {
    const { fileId, mediaId, episodeId, language } = request.body as {
      fileId: number;
      mediaId?: number;
      episodeId?: number;
      language: string;
    };

    if (!fileId || !language) {
      return reply.status(400).send({ error: 'fileId and language are required' });
    }

    const result = await subtitlesService.downloadSubtitle(fileId, mediaId, episodeId, language);

    if (!result.success) {
      return reply.status(400).send({ error: result.message });
    }

    return result;
  });

  app.get('/api/subtitles/:mediaId', async (request) => {
    const { mediaId } = request.params as { mediaId: string };
    const id = parseInt(mediaId, 10);
    const subtitles = subtitlesRepository.findByMediaId(id);
    return { subtitles };
  });

  app.get('/api/subtitles/episode/:episodeId', async (request) => {
    const { episodeId } = request.params as { episodeId: string };
    const id = parseInt(episodeId, 10);
    const subtitles = subtitlesRepository.findByEpisodeId(id);
    return { subtitles };
  });
}
