export interface VideoSearchResultItemDto {
  youTubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  popularityTier: string;
}

export interface SearchVideosResponseDto {
  videos: VideoSearchResultItemDto[];
  quotaNearLimit: boolean;
}
