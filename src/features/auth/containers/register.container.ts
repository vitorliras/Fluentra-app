import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordMaskDirective } from '../../../core/directives/password-mask.directive';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthGateway } from '../data-access/auth.gateway';
import { RegisterForm } from '../forms/register.form';

const ERROR_MESSAGES: Record<string, string> = {
  EmailAlreadyExists: 'Já existe uma conta com esse e-mail.',
  UsernameAlreadyExists: 'Esse username já está em uso.',
};

@Component({
  selector: 'app-register-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PasswordMaskDirective, RouterLink],
  providers: [RegisterForm],
  templateUrl: './register.container.html',
  styleUrl: '../containers/login.container.scss',
})
export class RegisterContainer {
  private readonly gateway = inject(AuthGateway);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly form = inject(RegisterForm);

  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.group.invalid) {
      this.form.group.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.gateway.register(this.form.group.getRawValue()).subscribe((result) => {
      this.isSubmitting.set(false);

      if (result.isSuccess && result.value) {
        this.notification.success('Conta criada! Agora é só entrar.');
        this.router.navigateByUrl('/login');
        return;
      }

      const code = result.error?.code ?? 'UnexpectedError';
      this.notification.error(ERROR_MESSAGES[code] ?? 'Não foi possível criar a conta. Verifique os dados e tente de novo.');
    });
  }
}
