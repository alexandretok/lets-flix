export interface Media {
  id: number;
  tmdb_id: number;
  type: 'movie' | 'series';
  title: string;
  poster_url: string | null;
  overview: string | null;
  status: 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
  disk_path: string | null;
  duration: number | null;
  downloaded_at: string | null;
  created_at: string;
}

export interface Episode {
  id: number;
  media_id: number;
  season_number: number;
  episode_number: number;
  title: string | null;
  status: 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
  disk_path: string | null;
  downloaded_at: string | null;
  created_at: string;
}

export interface Subtitle {
  id: number;
  media_id: number | null;
  episode_id: number | null;
  language_code: string;
  disk_path: string;
  created_at: string;
}

export interface WatchProgress {
  id: number;
  user_id: number;
  media_id: number | null;
  episode_id: number | null;
  stopped_at_seconds: number;
  is_watched: number;
  updated_at: string;
}

export type MediaStatus = 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
