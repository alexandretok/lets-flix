export interface Setting {
  key: string;
  value: string;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface SubtitleSearchResult {
  id: string;
  language: string;
  release: string;
  fileId: number;
  fileName: string;
}
