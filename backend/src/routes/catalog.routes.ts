import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { tmdbService } from '../services/tmdb.service.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { catalogRepository } from '../repositories/catalog.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.get('/api/search', async (request) => {
    const { query } = request.query as { query?: string };
    if (!query || query.trim().length === 0) {
      return { results: [] };
    }
    const results = await tmdbService.searchMulti(query);
    return { results };
  });

  app.get('/api/catalog', async (request) => {
    const items = catalogRepository.findByUser(request.user.userId);
    return { catalog: items };
  });

  app.post('/api/catalog/add', async (request, reply) => {
    const { tmdb_id, type } = request.body as { tmdb_id: number; type: 'movie' | 'series' };

    if (!tmdb_id || !type) {
      return reply.status(400).send({ error: 'tmdb_id and type are required' });
    }

    let media = mediaRepository.findByTmdbId(tmdb_id);

    if (!media) {
      if (type === 'movie') {
        const details = await tmdbService.getMovieDetails(tmdb_id);
        media = mediaRepository.create({
          tmdb_id,
          type: 'movie',
          title: details.title,
          poster_url: details.poster_url,
          overview: details.overview,
          status: 'pending',
          disk_path: null,
          duration: details.runtime ? details.runtime * 60 : null,
        });
      } else {
        const details = await tmdbService.getSeriesDetails(tmdb_id);
        media = mediaRepository.create({
          tmdb_id,
          type: 'series',
          title: details.name,
          poster_url: details.poster_url,
          overview: details.overview,
          status: 'pending',
          disk_path: null,
          duration: null,
        });
      }
    }

    catalogRepository.addToCatalog(request.user.userId, media.id);
    return { media };
  });

  app.post('/api/catalog/add-series', async (request, reply) => {
    const { tmdb_id, selected_episodes } = request.body as {
      tmdb_id: number;
      selected_episodes: { season: number; episode: number; title?: string }[];
    };

    if (!tmdb_id || !selected_episodes || selected_episodes.length === 0) {
      return reply.status(400).send({ error: 'tmdb_id and selected_episodes are required' });
    }

    let media = mediaRepository.findByTmdbId(tmdb_id);

    if (!media) {
      const details = await tmdbService.getSeriesDetails(tmdb_id);
      media = mediaRepository.create({
        tmdb_id,
        type: 'series',
        title: details.name,
        poster_url: details.poster_url,
        overview: details.overview,
        status: 'pending',
        disk_path: null,
        duration: null,
      });
    }

    const episodeData = selected_episodes.map(ep => ({
      media_id: media!.id,
      season_number: ep.season,
      episode_number: ep.episode,
      title: ep.title,
    }));

    const episodes = episodesRepository.createBatch(episodeData);
    catalogRepository.addToCatalog(request.user.userId, media.id);

    return { media, episodes };
  });

  app.delete('/api/catalog/:mediaId', async (request, reply) => {
    const { mediaId } = request.params as { mediaId: string };
    const id = parseInt(mediaId, 10);

    if (!catalogRepository.isInCatalog(request.user.userId, id)) {
      return reply.status(404).send({ error: 'Not in catalog' });
    }

    catalogRepository.removeFromCatalog(request.user.userId, id);
    return { message: 'Removed from catalog' };
  });

  app.get('/api/media/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const media = mediaRepository.findById(parseInt(id, 10));

    if (!media) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    let episodes: any[] = [];
    if (media.type === 'series') {
      episodes = episodesRepository.findByMediaId(media.id);
    }

    return { media, episodes };
  });

  app.get('/api/tmdb/series/:tmdbId/seasons', async (request) => {
    const { tmdbId } = request.params as { tmdbId: string };
    const details = await tmdbService.getSeriesDetails(parseInt(tmdbId, 10));
    return { seasons: details.seasons };
  });

  app.get('/api/tmdb/series/:tmdbId/season/:seasonNumber', async (request) => {
    const { tmdbId, seasonNumber } = request.params as { tmdbId: string; seasonNumber: string };
    const episodes = await tmdbService.getSeasonDetails(parseInt(tmdbId, 10), parseInt(seasonNumber, 10));
    return { episodes };
  });
}
