export type PopularityTier = 'Pequena' | 'Media' | 'Grande' | 'Viral';

export interface VideoSearchResult {
  youTubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  popularityTier: PopularityTier;
}

export interface SearchVideosResult {
  videos: VideoSearchResult[];
  quotaNearLimit: boolean;
}
