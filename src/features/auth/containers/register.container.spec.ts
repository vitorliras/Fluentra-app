import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Result } from '../../../shared/results/result';
import { ResultError } from '../../../shared/results/error';
import { AuthGateway } from '../data-access/auth.gateway';
import { User } from '../data-access/models/user.model';
import { RegisterContainer } from './register.container';

// Fake devolve a própria chave — o Container só precisa escolher a chave certa;
// o conteúdo traduzido de fato é responsabilidade dos dicionários JSON, não do Container.
const fakeLanguageService = { t: (key: string) => key };

function createContainer(gateway: Partial<AuthGateway>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthGateway, useValue: gateway },
      { provide: LanguageService, useValue: fakeLanguageService },
    ],
  });

  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

  return { container: TestBed.createComponent(RegisterContainer).componentInstance, navigateByUrl };
}

function validFormValue() {
  return { name: 'Vitor Teste', username: 'vitor_teste_qa', email: 'vitor@example.com', password: 'Senha123!' };
}

describe('RegisterContainer', () => {
  it('should notify success and navigate to login when the gateway succeeds', () => {
    const user: User = { id: 1, name: 'Vitor Teste', username: 'vitor_teste_qa', email: 'vitor@example.com' };
    const { container, navigateByUrl } = createContainer({ register: () => of(Result.success(user)) });

    container['form'].group.setValue(validFormValue());
    container['submit']();

    const notification = TestBed.inject(NotificationService);
    expect(notification.queue().at(-1)?.tone).toBe('success');
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should notify the specific error when the email already exists', () => {
    const { container, navigateByUrl } = createContainer({
      register: () => of(Result.failure<User>(ResultError.from('EmailAlreadyExists'))),
    });

    container['form'].group.setValue(validFormValue());
    container['submit']();

    const notification = TestBed.inject(NotificationService);
    const lastNotification = notification.queue().at(-1);
    expect(lastNotification?.tone).toBe('error');
    expect(lastNotification?.message).toBe('auth.errors.emailAlreadyExists');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('should not call the gateway when the form is invalid', () => {
    const register = vi.fn();
    const { container } = createContainer({ register });

    container['submit']();

    expect(register).not.toHaveBeenCalled();
  });
});
