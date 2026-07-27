import { config } from '../config/env.js';
import { getMockTorrentResults } from '../mocks/indexer.mock.js';
import { settingsRepository } from '../repositories/settings.repository.js';

export interface TorrentResult {
  title: string;
  magnetUri: string;
  size: number;
  seeders: number;
  leechers: number;
}

export const indexerService = {
  async searchTorrents(title: string, year?: string, type?: string): Promise<TorrentResult[]> {
    const resolutions = settingsRepository.getJson<string[]>('allowed_resolutions') || ['720p', '1080p'];
    const codecFilter = ['x264', 'H.264', 'h264', 'mp4'];

    if (config.useMocks) {
      const results = getMockTorrentResults(title);
      return results
        .filter(r => {
          const hasCodec = codecFilter.some(c => r.title.toLowerCase().includes(c.toLowerCase()));
          const hasResolution = resolutions.some(res => r.title.includes(res));
          return hasCodec && hasResolution;
        })
        .sort((a, b) => b.seeders - a.seeders);
    }

    const searchQuery = buildSearchQuery(title, year, resolutions);

    try {
      const url = `${config.indexerUrl}/api/v2.0/indexers/all/results?apikey=${config.indexerApiKey}&Query=${encodeURIComponent(searchQuery)}&Category[]=${type === 'series' ? '5000' : '2000'}`;
      const res = await fetch(url);
      const data = await res.json() as any;

      return (data.Results || [])
        .filter((r: any) => {
          const titleLower = r.Title.toLowerCase();
          const hasCodec = codecFilter.some(c => titleLower.includes(c.toLowerCase()));
          const hasResolution = resolutions.some(res => r.Title.includes(res));
          return hasCodec && hasResolution;
        })
        .map((r: any) => ({
          title: r.Title,
          magnetUri: r.MagnetUri || r.Link,
          size: r.Size,
          seeders: r.Seeders,
          leechers: r.Peers,
        }))
        .sort((a: TorrentResult, b: TorrentResult) => b.seeders - a.seeders);
    } catch (error) {
      console.error('Indexer search failed:', error);
      return [];
    }
  },
};

function buildSearchQuery(title: string, year?: string, resolutions?: string[]): string {
  let query = title;
  if (year) query += ` ${year}`;
  if (resolutions && resolutions.length > 0) {
    query += ` (${resolutions.join('|')})`;
  }
  return query;
}
