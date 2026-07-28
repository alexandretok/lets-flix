import { Media } from './media.types.js';

export interface UserCatalog {
  id: number;
  user_id: number;
  media_id: number;
  added_at: string;
}

export interface CatalogMediaItem extends Media {
  added_at: string;
  last_watched_at: string | null;
}
