import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: JWT_SECRET });

app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`LetsFlix backend running on port ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
