import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from '../services/language.service';
import { NotificationService } from '../services/notification.service';
import { SessionService } from '../services/session.service';
import { errorInterceptor } from './error.interceptor';

const fakeLanguageService = { t: (key: string) => key };

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([errorInterceptor])),
      provideHttpClientTesting(),
      provideRouter([{ path: 'login', children: [] }]),
      { provide: LanguageService, useValue: fakeLanguageService },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    session: TestBed.inject(SessionService),
    notification: TestBed.inject(NotificationService),
    router: TestBed.inject(Router),
  };
}

describe('errorInterceptor', () => {
  beforeEach(() => localStorage.clear());

  it('should clear the session and redirect to login on a 401 for an authenticated request', async () => {
    const { http, httpMock, session, notification, router } = setup();
    session.setToken('expired-token');

    http.get('/shadowing/videos/search', { headers: { Authorization: 'Bearer expired-token' } }).subscribe({
      error: () => {},
    });

    httpMock.expectOne('/shadowing/videos/search').flush(null, { status: 401, statusText: 'Unauthorized' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(session.token()).toBeNull();
    expect(notification.queue().at(-1)?.message).toBe('auth.errors.sessionExpired');
    expect(router.url).toBe('/login');
  });

  it('should not treat a 401 on an unauthenticated request as a session expiry', () => {
    const { http, httpMock, session, notification } = setup();

    http.post('/auth/login', {}).subscribe({ error: () => {} });

    httpMock.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(session.token()).toBeNull();
    expect(notification.queue().length).toBe(0);
  });
});
