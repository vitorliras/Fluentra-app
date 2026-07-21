export type PronunciationMark = 'Correct' | 'Approximate' | 'Incorrect';

export interface WordEvaluation {
  targetWord: string;
  recognizedWord: string | null;
  mark: PronunciationMark;
}

export interface PronunciationEvaluation {
  words: WordEvaluation[];
  accuracyRate: number;
  shouldRepeat: boolean;
}
