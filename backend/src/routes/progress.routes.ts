import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { watchProgressRepository } from '../repositories/watch-progress.repository.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { storageService } from '../services/storage.service.js';

export async function progressRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.post('/api/progress', async (request) => {
    const { mediaId, episodeId, stoppedAtSeconds } = request.body as {
      mediaId?: number;
      episodeId?: number;
      stoppedAtSeconds: number;
    };

    const userId = request.user.userId;
    let duration: number | null = null;
    let isWatched = false;

    if (mediaId) {
      const media = mediaRepository.findById(mediaId);
      duration = media?.duration || null;
    }

    // 90% completion rule
    if (duration && stoppedAtSeconds > duration * 0.9) {
      isWatched = true;
    }

    watchProgressRepository.upsert({
      user_id: userId,
      media_id: mediaId,
      episode_id: episodeId,
      stopped_at_seconds: stoppedAtSeconds,
      is_watched: isWatched,
    });

    // Auto-delete check
    if (isWatched && mediaId) {
      const autoDelete = settingsRepository.get('auto_delete_watched');
      if (autoDelete === 'true') {
        if (watchProgressRepository.isWatchedByAllUsers(mediaId)) {
          storageService.deleteMediaFile(mediaId);
        }
      }
    }

    return { saved: true, isWatched };
  });

  app.get('/api/progress/:mediaId', async (request) => {
    const { mediaId } = request.params as { mediaId: string };
    const id = parseInt(mediaId, 10);
    const progress = watchProgressRepository.findByUserAndMedia(request.user.userId, id);
    return { progress: progress || null };
  });

  app.get('/api/progress/episode/:episodeId', async (request) => {
    const { episodeId } = request.params as { episodeId: string };
    const id = parseInt(episodeId, 10);
    const progress = watchProgressRepository.findByUserAndEpisode(request.user.userId, id);
    return { progress: progress || null };
  });
}
