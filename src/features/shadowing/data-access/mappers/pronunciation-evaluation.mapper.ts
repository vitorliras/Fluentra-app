import { EvaluatePronunciationResponseDto, WordEvaluationDto } from '../models/pronunciation-evaluation.dto';
import { PronunciationEvaluation, PronunciationMark, WordEvaluation } from '../models/pronunciation-evaluation.model';

export function toWordEvaluation(dto: WordEvaluationDto): WordEvaluation {
  return {
    targetWord: dto.targetWord,
    recognizedWord: dto.recognizedWord,
    mark: dto.mark as PronunciationMark,
  };
}

export function toPronunciationEvaluation(dto: EvaluatePronunciationResponseDto): PronunciationEvaluation {
  return {
    words: dto.words.map(toWordEvaluation),
    accuracyRate: dto.accuracyRate,
    shouldRepeat: dto.shouldRepeat,
  };
}
