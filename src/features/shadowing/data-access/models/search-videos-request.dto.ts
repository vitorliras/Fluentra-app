export interface SearchVideosRequestDto {
  subject: string;
  desiredDurationMinutes: number;
}

export interface GetVideoByUrlRequestDto {
  url: string;
}
