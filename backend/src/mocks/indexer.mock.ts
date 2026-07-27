export interface MockTorrentResult {
  title: string;
  magnetUri: string;
  size: number;
  seeders: number;
  leechers: number;
  category: string;
}

export function getMockTorrentResults(query: string): MockTorrentResult[] {
  const baseMagnet = 'magnet:?xt=urn:btih:' + Buffer.from(query).toString('hex').padEnd(40, '0').slice(0, 40);

  return [
    {
      title: `${query} 1080p WEB-DL x264 - MockRelease`,
      magnetUri: `${baseMagnet}&dn=${encodeURIComponent(query + ' 1080p')}&tr=udp://tracker.mock.com:6969`,
      size: 2_147_483_648,
      seeders: 150,
      leechers: 20,
      category: 'Movies',
    },
    {
      title: `${query} 720p BluRay x264 - MockGroup`,
      magnetUri: `${baseMagnet}1&dn=${encodeURIComponent(query + ' 720p')}&tr=udp://tracker.mock.com:6969`,
      size: 1_073_741_824,
      seeders: 85,
      leechers: 12,
      category: 'Movies',
    },
    {
      title: `${query} 2160p WEB-DL H.264 HDR - Premium`,
      magnetUri: `${baseMagnet}2&dn=${encodeURIComponent(query + ' 2160p')}&tr=udp://tracker.mock.com:6969`,
      size: 8_589_934_592,
      seeders: 45,
      leechers: 8,
      category: 'Movies',
    },
  ];
}

export function getMockTorrentResultsEmpty(): MockTorrentResult[] {
  return [];
}
