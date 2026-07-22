import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { ResultError } from '../../../shared/results/error';
import { Result } from '../../../shared/results/result';
import { toSearchVideosResult, toVideoSearchResult } from './mappers/video-search-result.mapper';
import { toImportedVideo } from './mappers/video-import.mapper';
import { toPronunciationEvaluation } from './mappers/pronunciation-evaluation.mapper';
import { toShadowingHistoryResult } from './mappers/shadowing-history.mapper';
import { GetVideoByUrlRequestDto, SearchVideosRequestDto } from './models/search-videos-request.dto';
import { SearchVideosResponseDto, VideoSearchResultItemDto } from './models/video-search-result.dto';
import { SearchVideosResult, VideoSearchResult } from './models/video-search-result.model';
import { ImportVideoRequestDto, ImportVideoResponseDto } from './models/video-import.dto';
import { ImportedVideo } from './models/video-import.model';
import { EvaluatePronunciationResponseDto } from './models/pronunciation-evaluation.dto';
import { PronunciationEvaluation } from './models/pronunciation-evaluation.model';
import { ShadowingHistoryResponseDto } from './models/shadowing-history.dto';
import { ShadowingHistoryResult } from './models/shadowing-history.model';

interface ApiErrorBody {
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class ShadowingGateway {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  searchVideos(request: SearchVideosRequestDto): Observable<Result<SearchVideosResult>> {
    return this.http.post<SearchVideosResponseDto>(`${this.apiUrl()}/shadowing/videos/search`, request).pipe(
      map((dto) => Result.success(toSearchVideosResult(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<SearchVideosResult>(this.toResultError(error)))),
    );
  }

  getVideoByUrl(request: GetVideoByUrlRequestDto): Observable<Result<VideoSearchResult>> {
    return this.http.post<VideoSearchResultItemDto>(`${this.apiUrl()}/shadowing/videos/by-url`, request).pipe(
      map((dto) => Result.success(toVideoSearchResult(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<VideoSearchResult>(this.toResultError(error)))),
    );
  }

  importVideo(request: ImportVideoRequestDto): Observable<Result<ImportedVideo>> {
    return this.http.post<ImportVideoResponseDto>(`${this.apiUrl()}/shadowing/videos/import`, request).pipe(
      map((dto) => Result.success(toImportedVideo(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<ImportedVideo>(this.toResultError(error)))),
    );
  }

  evaluatePronunciation(audio: Blob, targetText: string, sceneId: number): Observable<Result<PronunciationEvaluation>> {
    const formData = new FormData();
    formData.append('audio', audio, 'recording.wav');
    formData.append('targetText', targetText);
    formData.append('sceneId', String(sceneId));

    return this.http.post<EvaluatePronunciationResponseDto>(`${this.apiUrl()}/shadowing/pronunciation/evaluate`, formData).pipe(
      map((dto) => Result.success(toPronunciationEvaluation(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<PronunciationEvaluation>(this.toResultError(error)))),
    );
  }

  getHistory(): Observable<Result<ShadowingHistoryResult>> {
    return this.http.get<ShadowingHistoryResponseDto>(`${this.apiUrl()}/shadowing/videos/history`).pipe(
      map((dto) => Result.success(toShadowingHistoryResult(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<ShadowingHistoryResult>(this.toResultError(error)))),
    );
  }

  private apiUrl(): string {
    return this.configService.config['apiUrl'] as string;
  }

  private toResultError(error: HttpErrorResponse): ResultError {
    const body = error.error as ApiErrorBody | null;
    return ResultError.from(body?.code ?? 'UnexpectedError');
  }
}
