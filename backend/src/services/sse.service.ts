import { FastifyReply } from 'fastify';
import { DownloadProgress } from './download.service.js';

interface SSEClient {
  id: string;
  userId: number;
  reply: FastifyReply;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, userId: number, reply: FastifyReply): void {
    this.clients.set(id, { id, userId, reply });
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  broadcast(event: string, data: DownloadProgress): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.reply.raw.write(message);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  broadcastToUser(userId: number, event: string, data: any): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.reply.raw.write(message);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseService = new SSEService();
