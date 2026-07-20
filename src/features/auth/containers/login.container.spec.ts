import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionService } from '../../../core/services/session.service';
import { Result } from '../../../shared/results/result';
import { ResultError } from '../../../shared/results/error';
import { AuthGateway } from '../data-access/auth.gateway';
import { Session } from '../data-access/models/session.model';
import { LoginContainer } from './login.container';

// Fake devolve a própria chave — o Container só precisa escolher a chave certa;
// o conteúdo traduzido de fato é responsabilidade dos dicionários JSON, não do Container.
const fakeLanguageService = { t: (key: string) => key };

function createContainer(gateway: Partial<AuthGateway>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'shadowing', children: [] }]),
      { provide: AuthGateway, useValue: gateway },
      { provide: LanguageService, useValue: fakeLanguageService },
    ],
  });

  return TestBed.createComponent(LoginContainer).componentInstance;
}

describe('LoginContainer', () => {
  beforeEach(() => localStorage.clear());

  it('should store the token and notify success when the gateway succeeds', () => {
    const session: Session = {
      accessToken: 'token-abc',
      expiresAt: new Date('2026-07-18T12:00:00Z'),
      name: 'Vitor Teste',
      username: 'vitor_teste_qa',
    };
    const gateway = { login: () => of(Result.success(session)) };
    const container = createContainer(gateway);

    container['form'].group.setValue({ identifier: 'vitor_teste_qa', password: 'Senha123!' });
    container['submit']();

    const sessionService = TestBed.inject(SessionService);
    const notification = TestBed.inject(NotificationService);
    expect(sessionService.token()).toBe('token-abc');
    expect(notification.queue().at(-1)?.tone).toBe('success');
  });

  it('should notify the invalid credentials error when the gateway fails', () => {
    const gateway = { login: () => of(Result.failure<Session>(ResultError.from('InvalidCredentials'))) };
    const container = createContainer(gateway);

    container['form'].group.setValue({ identifier: 'vitor_teste_qa', password: 'senha-errada' });
    container['submit']();

    const sessionService = TestBed.inject(SessionService);
    const notification = TestBed.inject(NotificationService);
    expect(sessionService.token()).toBeNull();
    const lastNotification = notification.queue().at(-1);
    expect(lastNotification?.tone).toBe('error');
    expect(lastNotification?.message).toBe('auth.errors.invalidCredentials');
  });

  it('should not call the gateway when the form is invalid', () => {
    const login = vi.fn();
    const container = createContainer({ login });

    container['submit']();

    expect(login).not.toHaveBeenCalled();
  });
});
