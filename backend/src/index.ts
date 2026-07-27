import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { getDb } from './database/init.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.jwtSecret });

// Initialize database
getDb();
console.log('Database initialized successfully');

app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`LetsFlix backend running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
