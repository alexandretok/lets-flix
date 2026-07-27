import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { sseService } from '../services/sse.service.js';

export async function eventsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/events', async (request, reply) => {
    const token = (request.query as any).token;
    let userId = 0;

    if (token) {
      try {
        const decoded = app.jwt.verify<{ userId: number }>(token);
        userId = decoded.userId;
      } catch {
        // Allow unauthenticated SSE for now, just no filtering
      }
    }

    const clientId = randomUUID();

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

    sseService.addClient(clientId, userId, reply);

    request.raw.on('close', () => {
      sseService.removeClient(clientId);
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(':heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseService.removeClient(clientId);
      }
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
    });
  });
}
