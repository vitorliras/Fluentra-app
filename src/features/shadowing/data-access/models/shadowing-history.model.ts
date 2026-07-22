export interface ShadowingHistoryItem {
  youTubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  completedScenes: number;
  totalScenes: number;
}

export interface ShadowingHistoryResult {
  items: ShadowingHistoryItem[];
}
