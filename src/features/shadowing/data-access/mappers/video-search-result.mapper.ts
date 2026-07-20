import {
  SearchVideosResponseDto,
  VideoSearchResultItemDto,
} from '../models/video-search-result.dto';
import {
  PopularityTier,
  SearchVideosResult,
  VideoSearchResult,
} from '../models/video-search-result.model';

export function toVideoSearchResult(dto: VideoSearchResultItemDto): VideoSearchResult {
  return {
    youTubeVideoId: dto.youTubeVideoId,
    title: dto.title,
    thumbnailUrl: dto.thumbnailUrl,
    durationSeconds: parseDuration(dto.duration),
    viewCount: dto.viewCount,
    likeCount: dto.likeCount,
    popularityTier: dto.popularityTier as PopularityTier,
  };
}

export function toSearchVideosResult(dto: SearchVideosResponseDto): SearchVideosResult {
  return {
    videos: dto.videos.map(toVideoSearchResult),
    quotaNearLimit: dto.quotaNearLimit,
  };
}

function parseDuration(value: string): number {
  const parts = value.split(':').map(Number);
  return parts.reduce((total, part) => total * 60 + part, 0);
}
