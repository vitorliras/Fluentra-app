import { EvaluatePronunciationResponseDto } from './pronunciation-evaluation.dto';

export interface SceneItemDto {
  id: number;
  text: string;
  translations: Record<string, string>;
  startSeconds: number;
  endSeconds: number;
  sequenceOrder: number;
  completed: boolean;
  lastEvaluation: EvaluatePronunciationResponseDto | null;
}

export interface ImportVideoResponseDto {
  videoId: number;
  title: string;
  scenes: SceneItemDto[];
}

export interface ImportVideoRequestDto {
  youTubeVideoId: string;
}
