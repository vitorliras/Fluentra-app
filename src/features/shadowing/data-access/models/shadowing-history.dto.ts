export interface ShadowingHistoryItemDto {
  youTubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  completedScenes: number;
  totalScenes: number;
}

export interface ShadowingHistoryResponseDto {
  items: ShadowingHistoryItemDto[];
}
