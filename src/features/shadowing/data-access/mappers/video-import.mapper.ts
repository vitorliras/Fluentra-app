import { ImportVideoResponseDto, SceneItemDto } from '../models/video-import.dto';
import { ImportedVideo, Scene } from '../models/video-import.model';

export function toScene(dto: SceneItemDto): Scene {
  return {
    id: dto.id,
    text: dto.text,
    translation: dto.translation,
    startSeconds: dto.startSeconds,
    endSeconds: dto.endSeconds,
    sequenceOrder: dto.sequenceOrder,
  };
}

export function toImportedVideo(dto: ImportVideoResponseDto): ImportedVideo {
  return {
    videoId: dto.videoId,
    title: dto.title,
    scenes: dto.scenes.map(toScene),
  };
}
