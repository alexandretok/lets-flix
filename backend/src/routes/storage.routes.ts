import { FastifyInstance } from 'fastify';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { storageService } from '../services/storage.service.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export async function storageRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.get('/api/storage/status', async () => {
    const usage = storageService.getDiskUsage();
    return {
      ...usage,
      warning: usage.percentage > 80,
      critical: usage.percentage > 95,
    };
  });

  app.delete('/api/storage/media/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const mediaId = parseInt(id, 10);

    const media = mediaRepository.findById(mediaId);
    if (!media) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    // Safe deletion: only delete if catalog link count is zero
    const linkCount = mediaRepository.getCatalogLinkCount(mediaId);
    if (linkCount > 0) {
      // Remove from current user's catalog first
      catalogRepository.removeFromCatalog(request.user.userId, mediaId);
      const newLinkCount = mediaRepository.getCatalogLinkCount(mediaId);
      if (newLinkCount > 0) {
        return { message: 'Removed from your catalog. File preserved for other users.', fileDeleted: false };
      }
    }

    storageService.deleteMediaFile(mediaId);
    return { message: 'File deleted successfully', fileDeleted: true };
  });
}
