import { ShadowingHistoryItemDto, ShadowingHistoryResponseDto } from '../models/shadowing-history.dto';
import { ShadowingHistoryItem, ShadowingHistoryResult } from '../models/shadowing-history.model';

export function toShadowingHistoryItem(dto: ShadowingHistoryItemDto): ShadowingHistoryItem {
  return {
    youTubeVideoId: dto.youTubeVideoId,
    title: dto.title,
    thumbnailUrl: dto.thumbnailUrl,
    completedScenes: dto.completedScenes,
    totalScenes: dto.totalScenes,
  };
}

export function toShadowingHistoryResult(dto: ShadowingHistoryResponseDto): ShadowingHistoryResult {
  return {
    items: dto.items.map(toShadowingHistoryItem),
  };
}
