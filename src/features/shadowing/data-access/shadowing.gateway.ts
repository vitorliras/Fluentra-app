import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { ResultError } from '../../../shared/results/error';
import { Result } from '../../../shared/results/result';
import { toSearchVideosResult, toVideoSearchResult } from './mappers/video-search-result.mapper';
import { GetVideoByUrlRequestDto, SearchVideosRequestDto } from './models/search-videos-request.dto';
import { SearchVideosResponseDto, VideoSearchResultItemDto } from './models/video-search-result.dto';
import { SearchVideosResult, VideoSearchResult } from './models/video-search-result.model';

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

  private apiUrl(): string {
    return this.configService.config['apiUrl'] as string;
  }

  private toResultError(error: HttpErrorResponse): ResultError {
    const body = error.error as ApiErrorBody | null;
    return ResultError.from(body?.code ?? 'UnexpectedError');
  }
}
