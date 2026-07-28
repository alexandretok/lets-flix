export interface CatalogItem {
  id: number;
  tmdb_id: number;
  type: 'movie' | 'series';
  title: string;
  poster_url: string | null;
  overview: string | null;
  status: 'pending' | 'searching' | 'downloading' | 'downloaded' | 'not_found';
  disk_path: string | null;
  added_at: string;
  last_watched_at: string | null;
}

export interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  vote_average: number;
  _expanded?: boolean;
}

export interface EpisodeInfo {
  id: number;
  media_id: number;
  season_number: number;
  episode_number: number;
  title: string | null;
  status: string;
}

export interface EpisodeSaveResult {
  added: number;
  removed: number;
}
