export interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  vote_average: number;
}

export interface TmdbSearchResponse {
  results: TmdbSearchResult[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
}

export interface TmdbSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_url: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_seasons: number;
  seasons: { season_number: number; episode_count: number; name: string }[];
}

export interface TmdbEpisode {
  episode_number: number;
  name: string;
  overview: string;
}
