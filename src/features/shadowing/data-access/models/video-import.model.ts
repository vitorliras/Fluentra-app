export interface Scene {
  id: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  sequenceOrder: number;
}

export interface ImportedVideo {
  videoId: number;
  title: string;
  scenes: Scene[];
}
