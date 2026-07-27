import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { getMockSubtitleResults, getMockSrtContent } from '../mocks/subtitles.mock.js';
import { convertSrtToVtt } from '../utils/srt-to-vtt.js';
import { subtitlesRepository } from '../repositories/subtitles.repository.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { episodesRepository } from '../repositories/episodes.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';

export interface SubtitleSearchResult {
  id: string;
  language: string;
  release: string;
  fileId: number;
  fileName: string;
}

export const subtitlesService = {
  async searchSubtitles(tmdbId: number, language: string, type: string, season?: number, episode?: number): Promise<SubtitleSearchResult[]> {
    if (config.useMocks) {
      const results = getMockSubtitleResults(language);
      return results.map(r => ({
        id: r.id,
        language: r.attributes.language,
        release: r.attributes.release,
        fileId: r.attributes.files[0].file_id,
        fileName: r.attributes.files[0].file_name,
      }));
    }

    try {
      let url = `https://api.opensubtitles.com/api/v1/subtitles?tmdb_id=${tmdbId}&languages=${language}&type=${type === 'movie' ? 'movie' : 'episode'}`;
      if (season) url += `&season_number=${season}`;
      if (episode) url += `&episode_number=${episode}`;

      const res = await fetch(url, {
        headers: {
          'Api-Key': config.opensubtitlesApiKey,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json() as any;

      return (data.data || []).map((r: any) => ({
        id: r.id,
        language: r.attributes.language,
        release: r.attributes.release,
        fileId: r.attributes.files[0]?.file_id,
        fileName: r.attributes.files[0]?.file_name,
      }));
    } catch (error) {
      console.error('Subtitle search failed:', error);
      return [];
    }
  },

  async downloadSubtitle(fileId: number, mediaId?: number, episodeId?: number, language?: string): Promise<{ success: boolean; subtitle?: any; message?: string }> {
    let destDir: string;

    if (episodeId) {
      const episode = episodesRepository.findById(episodeId);
      if (!episode || !episode.disk_path) {
        return { success: false, message: 'Episode not downloaded yet' };
      }
      destDir = path.dirname(episode.disk_path);
    } else if (mediaId) {
      const media = mediaRepository.findById(mediaId);
      if (!media || !media.disk_path) {
        return { success: false, message: 'Media not downloaded yet' };
      }
      destDir = path.dirname(media.disk_path);
    } else {
      return { success: false, message: 'mediaId or episodeId required' };
    }

    const langCode = language || 'en';
    const vttFileName = `subtitle_${langCode}_${fileId}.vtt`;
    const vttPath = path.join(destDir, vttFileName);

    let srtContent: string;

    if (config.useMocks) {
      srtContent = getMockSrtContent();
    } else {
      try {
        const res = await fetch('https://api.opensubtitles.com/api/v1/download', {
          method: 'POST',
          headers: {
            'Api-Key': config.opensubtitlesApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_id: fileId }),
        });
        const data = await res.json() as any;

        const fileRes = await fetch(data.link);
        srtContent = await fileRes.text();
      } catch (error) {
        console.error('Subtitle download failed:', error);
        return { success: false, message: 'Failed to download subtitle' };
      }
    }

    const vttContent = convertSrtToVtt(srtContent);
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(vttPath, vttContent, 'utf-8');

    const subtitle = subtitlesRepository.create({
      media_id: mediaId,
      episode_id: episodeId,
      language_code: langCode,
      disk_path: vttPath,
    });

    return { success: true, subtitle };
  },

  async autoDownloadSubtitles(mediaId?: number, episodeId?: number): Promise<void> {
    const languages = settingsRepository.getJson<string[]>('subtitle_language') || ['en'];
    const media = mediaId ? mediaRepository.findById(mediaId) : null;
    const tmdbId = media?.tmdb_id;

    if (!tmdbId) return;

    for (const lang of languages) {
      let season: number | undefined;
      let episode: number | undefined;

      if (episodeId) {
        const ep = episodesRepository.findById(episodeId);
        if (ep) {
          season = ep.season_number;
          episode = ep.episode_number;
        }
      }

      const results = await this.searchSubtitles(
        tmdbId,
        lang,
        media!.type,
        season,
        episode
      );

      if (results.length > 0) {
        await this.downloadSubtitle(results[0].fileId, mediaId, episodeId, lang);
      }
    }
  },
};
