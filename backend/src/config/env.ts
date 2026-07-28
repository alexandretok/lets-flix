import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  databaseUrl: process.env.DATABASE_URL || 'file:./database.sqlite',
  downloadDir: process.env.DOWNLOAD_DIR || './downloads',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  opensubtitlesApiKey: process.env.OPENSUBTITLES_API_KEY || '',
  indexerUrl: process.env.INDEXER_URL || 'http://localhost:9117',
  indexerApiKey: process.env.INDEXER_API_KEY || '',
  useMocks: process.env.USE_MOCKS === 'true',
};
