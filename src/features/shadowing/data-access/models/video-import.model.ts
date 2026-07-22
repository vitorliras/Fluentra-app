import { PronunciationEvaluation } from './pronunciation-evaluation.model';

export interface Scene {
  id: number;
  text: string;
  translations: Record<string, string>;
  startSeconds: number;
  endSeconds: number;
  sequenceOrder: number;
  completed: boolean;
  lastEvaluation: PronunciationEvaluation | null;
}

export interface ImportedVideo {
  videoId: number;
  title: string;
  scenes: Scene[];
}
