import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { authenticate, requirePasswordChanged } from '../plugins/auth.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';
import { subtitlesRepository } from '../repositories/subtitles.repository.js';

export async function streamRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requirePasswordChanged);

  app.get('/api/stream/:mediaId', async (request, reply) => {
    const { mediaId } = request.params as { mediaId: string };
    const media = mediaRepository.findById(parseInt(mediaId, 10));

    if (!media || media.status !== 'downloaded' || !media.disk_path) {
      return reply.status(404).send({ error: 'Media not available for streaming' });
    }

    return streamFile(media.disk_path, request, reply);
  });

  app.get('/api/stream/episode/:episodeId', async (request, reply) => {
    const { episodeId } = request.params as { episodeId: string };
    const episode = episodesRepository.findById(parseInt(episodeId, 10));

    if (!episode || episode.status !== 'downloaded' || !episode.disk_path) {
      return reply.status(404).send({ error: 'Episode not available for streaming' });
    }

    return streamFile(episode.disk_path, request, reply);
  });

  app.get('/api/stream/subtitle/:subtitleId', async (request, reply) => {
    const { subtitleId } = request.params as { subtitleId: string };
    const subtitle = subtitlesRepository.findById(parseInt(subtitleId, 10));

    if (!subtitle || !fs.existsSync(subtitle.disk_path)) {
      return reply.status(404).send({ error: 'Subtitle not found' });
    }

    const content = fs.readFileSync(subtitle.disk_path, 'utf-8');
    reply.header('Content-Type', 'text/vtt');
    reply.header('Content-Disposition', `inline; filename="${path.basename(subtitle.disk_path)}"`);
    return reply.send(content);
  });
}

function streamFile(filePath: string, request: any, reply: any): void {
  if (!fs.existsSync(filePath)) {
    reply.status(404).send({ error: 'File not found on disk' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();

  const contentType = getContentType(ext);
  const range = request.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });

    reply.raw.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });

    stream.pipe(reply.raw);
  } else {
    reply.raw.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    fs.createReadStream(filePath).pipe(reply.raw);
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.vtt': 'text/vtt',
  };
  return types[ext] || 'application/octet-stream';
}
