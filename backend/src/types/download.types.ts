export interface DownloadProgress {
  mediaId: number;
  episodeId?: number;
  progress: number;
  downloadSpeed: number;
  status: string;
}

export interface TorrentInfo {
  key: string;
  mediaId: number;
  episodeId?: number;
  mediaTitle: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  size: number;
  numPeers: number;
  numSeeds: number;
  ratio: number;
  timeRemaining: number;
  paused: boolean;
  done: boolean;
  infoHash: string;
  path: string;
}

export interface TorrentResult {
  title: string;
  magnetUri: string;
  size: number;
  seeders: number;
  leechers: number;
}
