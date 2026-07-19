import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordMaskDirective } from '../../../core/directives/password-mask.directive';
import { NotificationService } from '../../../core/services/notification.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthGateway } from '../data-access/auth.gateway';
import { LoginForm } from '../forms/login.form';

const ERROR_MESSAGES: Record<string, string> = {
  InvalidCredentials: 'E-mail/username ou senha incorretos.',
};

@Component({
  selector: 'app-login-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PasswordMaskDirective, RouterLink],
  providers: [LoginForm],
  templateUrl: './login.container.html',
  styleUrl: './login.container.scss',
})
export class LoginContainer {
  private readonly gateway = inject(AuthGateway);
  private readonly session = inject(SessionService);
  private readonly notification = inject(NotificationService);
  protected readonly form = inject(LoginForm);

  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.group.invalid) {
      this.form.group.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.gateway.login(this.form.group.getRawValue()).subscribe((result) => {
      this.isSubmitting.set(false);

      if (result.isSuccess && result.value) {
        this.session.setToken(result.value.accessToken);
        this.notification.success(`Bem-vindo de volta, ${result.value.name}!`);
        return;
      }

      const code = result.error?.code ?? 'UnexpectedError';
      this.notification.error(ERROR_MESSAGES[code] ?? 'Não foi possível entrar. Tente novamente.');
    });
  }
}
