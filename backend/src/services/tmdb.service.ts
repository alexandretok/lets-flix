import { config } from '../config/env.js';
import { TmdbSearchResult, TmdbMovieDetails, TmdbSeriesDetails, TmdbEpisode } from '../types/index.js';
export type { TmdbSearchResult, TmdbMovieDetails, TmdbSeriesDetails, TmdbEpisode } from '../types/index.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function posterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

export const tmdbService = {
  async searchMulti(query: string): Promise<TmdbSearchResult[]> {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${config.tmdbApiKey}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json() as any;
    return (data.results || [])
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r: any) => ({
        id: r.id,
        media_type: r.media_type,
        title: r.title || r.name,
        overview: r.overview,
        poster_url: posterUrl(r.poster_path),
        release_date: r.release_date || r.first_air_date,
        vote_average: r.vote_average,
      }));
  },

  async getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${config.tmdbApiKey}`
    );
    const data = await res.json() as any;
    return {
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_url: posterUrl(data.poster_path),
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
    };
  },

  async getSeriesDetails(tmdbId: number): Promise<TmdbSeriesDetails> {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${config.tmdbApiKey}`
    );
    const data = await res.json() as any;
    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      poster_url: posterUrl(data.poster_path),
      first_air_date: data.first_air_date,
      vote_average: data.vote_average,
      number_of_seasons: data.number_of_seasons,
      seasons: (data.seasons || []).filter((s: any) => s.season_number > 0),
    };
  },

  async getSeasonDetails(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${config.tmdbApiKey}`
    );
    const data = await res.json() as any;
    return (data.episodes || []).map((ep: any) => ({
      episode_number: ep.episode_number,
      name: ep.name,
      overview: ep.overview,
    }));
  },

  async getTrendingMovies(): Promise<TmdbSearchResult[]> {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${config.tmdbApiKey}`
    );
    const data = await res.json() as any;
    return (data.results || []).slice(0, 10).map((r: any) => ({
      id: r.id,
      media_type: 'movie' as const,
      title: r.title,
      overview: r.overview,
      poster_url: posterUrl(r.poster_path),
      release_date: r.release_date,
      vote_average: r.vote_average,
    }));
  },

  async getTrendingTv(): Promise<TmdbSearchResult[]> {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/tv/week?api_key=${config.tmdbApiKey}`
    );
    const data = await res.json() as any;
    return (data.results || []).slice(0, 10).map((r: any) => ({
      id: r.id,
      media_type: 'tv' as const,
      title: r.name,
      overview: r.overview,
      poster_url: posterUrl(r.poster_path),
      release_date: r.first_air_date,
      vote_average: r.vote_average,
    }));
  },
};
