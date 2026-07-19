import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordMaskDirective } from '../../../core/directives/password-mask.directive';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthGateway } from '../data-access/auth.gateway';
import { RegisterForm } from '../forms/register.form';

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  EmailAlreadyExists: 'auth.errors.emailAlreadyExists',
  UsernameAlreadyExists: 'auth.errors.usernameAlreadyExists',
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
  protected readonly languageService = inject(LanguageService);
  protected readonly form = inject(RegisterForm);

  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);

  private readonly passwordValue = signal('');

  // Só orienta o medidor visual — a validação real é feita pelos Validators do RegisterForm,
  // que já exigem os mesmos 3 critérios (mín. 8 caracteres, 1 número, 1 caractere especial).
  protected readonly passwordStrength = computed(() => {
    const value = this.passwordValue();
    return [value.length >= 8, /\d/.test(value), /[^\w\s]/.test(value)].filter(Boolean).length;
  });

  // Lê do FormControl, não do DOM — o input de senha é mascarado por
  // PasswordMaskDirective, então o valor real só existe no FormControl.
  constructor() {
    effect((onCleanup) => {
      const control = this.form.group.get('password')!;
      this.passwordValue.set(control.value ?? '');
      const subscription = control.valueChanges.subscribe((value) => this.passwordValue.set(value ?? ''));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected submit(): void {
    if (this.form.group.invalid) {
      this.form.group.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.gateway.register(this.form.group.getRawValue()).subscribe((result) => {
      this.isSubmitting.set(false);

      if (result.isSuccess && result.value) {
        this.notification.success(this.languageService.t('auth.register.success'));
        this.router.navigateByUrl('/login');
        return;
      }

      const code = result.error?.code ?? 'UnexpectedError';
      const messageKey = ERROR_MESSAGE_KEYS[code] ?? 'auth.errors.registerUnexpected';
      this.notification.error(this.languageService.t(messageKey));
    });
  }
}
