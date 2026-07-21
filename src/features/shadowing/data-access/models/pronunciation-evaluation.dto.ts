export interface WordEvaluationDto {
  targetWord: string;
  recognizedWord: string | null;
  mark: string;
}

export interface EvaluatePronunciationResponseDto {
  words: WordEvaluationDto[];
  accuracyRate: number;
  shouldRepeat: boolean;
}
