import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { ResultError } from '../../../shared/results/error';
import { Result } from '../../../shared/results/result';
import { toSession } from './mappers/session.mapper';
import { toUser } from './mappers/user.mapper';
import { CreateUserRequestDto } from './models/create-user-request.dto';
import { LoginRequestDto } from './models/login-request.dto';
import { Session } from './models/session.model';
import { SessionDto } from './models/session.dto';
import { User } from './models/user.model';
import { UserDto } from './models/user.dto';

interface ApiErrorBody {
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  register(request: CreateUserRequestDto): Observable<Result<User>> {
    return this.http.post<UserDto>(`${this.apiUrl()}/users`, request).pipe(
      map((dto) => Result.success(toUser(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<User>(this.toResultError(error)))),
    );
  }

  login(request: LoginRequestDto): Observable<Result<Session>> {
    return this.http.post<SessionDto>(`${this.apiUrl()}/auth/login`, request).pipe(
      map((dto) => Result.success(toSession(dto))),
      catchError((error: HttpErrorResponse) => of(Result.failure<Session>(this.toResultError(error)))),
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
