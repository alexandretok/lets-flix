import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  login(username: string, password: string): Observable<{ token: string; user: any }> {
    return this.http.post<{ token: string; user: any }>('/api/auth/login', { username, password });
  }

  changePassword(newPassword: string): Observable<{ token: string; message: string }> {
    return this.http.post<{ token: string; message: string }>('/api/auth/change-password', { newPassword });
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/users');
  }

  createUser(username: string, role: string): Observable<any> {
    return this.http.post('/api/users', { username, role });
  }

  resetPassword(userId: number): Observable<{ tempPassword: string }> {
    return this.http.post<{ tempPassword: string }>(`/api/users/${userId}/reset-password`, {});
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`/api/users/${id}`);
  }

  getTrending(): Observable<{ movies: any[]; tv: any[] }> {
    return this.http.get<{ movies: any[]; tv: any[] }>('/api/trending');
  }

  searchTMDB(query: string, page = 1): Observable<{ results: any[]; page: number; total_pages: number; total_results: number }> {
    return this.http.get<{ results: any[]; page: number; total_pages: number; total_results: number }>(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}`
    );
  }

  getCatalog(): Observable<{ catalog: any[] }> {
    return this.http.get<{ catalog: any[] }>('/api/catalog');
  }

  addToCatalog(tmdbId: number, type: string): Observable<any> {
    return this.http.post('/api/catalog/add', { tmdb_id: tmdbId, type });
  }

  addSeriesToCatalog(tmdbId: number, selectedEpisodes: any[]): Observable<any> {
    return this.http.post('/api/catalog/add-series', { tmdb_id: tmdbId, selected_episodes: selectedEpisodes });
  }

  removeFromCatalog(mediaId: number): Observable<any> {
    return this.http.delete(`/api/catalog/${mediaId}`);
  }

  getMediaByTmdbId(tmdbId: number): Observable<{ media: any; episodes: any[] }> {
    return this.http.get<{ media: any; episodes: any[] }>(`/api/media/by-tmdb/${tmdbId}`);
  }

  addEpisodes(mediaId: number, episodes: { season: number; episode: number; title?: string }[]): Observable<{ episodes: any[] }> {
    return this.http.post<{ episodes: any[] }>(`/api/media/${mediaId}/episodes`, { episodes });
  }

  removeEpisode(episodeId: number): Observable<any> {
    return this.http.delete(`/api/episodes/${episodeId}`);
  }

  getMedia(id: number): Observable<{ media: any; episodes: any[] }> {
    return this.http.get<{ media: any; episodes: any[] }>(`/api/media/${id}`);
  }

  getSeriesSeasons(tmdbId: number): Observable<{ seasons: any[] }> {
    return this.http.get<{ seasons: any[] }>(`/api/tmdb/series/${tmdbId}/seasons`);
  }

  getSeasonEpisodes(tmdbId: number, seasonNumber: number): Observable<{ episodes: any[] }> {
    return this.http.get<{ episodes: any[] }>(`/api/tmdb/series/${tmdbId}/season/${seasonNumber}`);
  }

  startDownload(mediaId: number, episodeId?: number): Observable<any> {
    return this.http.post(`/api/download/start/${mediaId}`, { episodeId });
  }

  retryDownload(mediaId: number, episodeId?: number): Observable<any> {
    return this.http.post(`/api/download/retry/${mediaId}`, { episodeId });
  }

  getDownloadStatus(): Observable<{ downloads: any[] }> {
    return this.http.get<{ downloads: any[] }>('/api/download/status');
  }

  getSubtitles(mediaId: number): Observable<{ subtitles: any[] }> {
    return this.http.get<{ subtitles: any[] }>(`/api/subtitles/${mediaId}`);
  }

  getEpisodeSubtitles(episodeId: number): Observable<{ subtitles: any[] }> {
    return this.http.get<{ subtitles: any[] }>(`/api/subtitles/episode/${episodeId}`);
  }

  searchSubtitles(mediaId: number, language: string): Observable<{ results: any[] }> {
    return this.http.get<{ results: any[] }>(`/api/subtitles/search?mediaId=${mediaId}&language=${language}`);
  }

  downloadSubtitle(fileId: number, mediaId: number, language: string, episodeId?: number): Observable<any> {
    return this.http.post('/api/subtitles/download', { fileId, mediaId, language, episodeId });
  }

  getStorageStatus(): Observable<any> {
    return this.http.get('/api/storage/status');
  }

  saveProgress(mediaId: number | undefined, episodeId: number | undefined, stoppedAtSeconds: number, duration?: number): Observable<any> {
    return this.http.post('/api/progress', { mediaId, episodeId, stoppedAtSeconds, duration });
  }

  getProgress(mediaId: number): Observable<{ progress: any }> {
    return this.http.get<{ progress: any }>(`/api/progress/${mediaId}`);
  }

  getEpisodeProgress(episodeId: number): Observable<{ progress: any }> {
    return this.http.get<{ progress: any }>(`/api/progress/episode/${episodeId}`);
  }

  getSettings(): Observable<{ settings: any }> {
    return this.http.get<{ settings: any }>('/api/settings');
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put('/api/settings', { settings });
  }

  getTorrents(): Observable<{ torrents: any[] }> {
    return this.http.get<{ torrents: any[] }>('/api/torrents');
  }

  pauseTorrent(infoHash: string): Observable<any> {
    return this.http.post(`/api/torrents/${infoHash}/pause`, {});
  }

  resumeTorrent(infoHash: string): Observable<any> {
    return this.http.post(`/api/torrents/${infoHash}/resume`, {});
  }

  removeTorrent(infoHash: string): Observable<any> {
    return this.http.post(`/api/torrents/${infoHash}/remove`, {});
  }

  deleteTorrentFile(key: string): Observable<any> {
    return this.http.post('/api/torrents/delete-file', { key });
  }
}
