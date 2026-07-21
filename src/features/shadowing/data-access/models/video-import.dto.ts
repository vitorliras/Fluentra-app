export interface SceneItemDto {
  id: number;
  text: string;
  translation: string | null;
  startSeconds: number;
  endSeconds: number;
  sequenceOrder: number;
}

export interface ImportVideoResponseDto {
  videoId: number;
  title: string;
  scenes: SceneItemDto[];
}

export interface ImportVideoRequestDto {
  youTubeVideoId: string;
}
