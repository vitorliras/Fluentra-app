import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageSelectorComponent } from '../../../core/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { LanguageService } from '../../../core/services/language.service';
import { AuthHeroPanelComponent } from '../components/auth-hero-panel/auth-hero-panel.component';
import { RegisterContainer } from '../containers/register.container';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthHeroPanelComponent, RegisterContainer, ThemeToggleComponent, LanguageSelectorComponent],
  templateUrl: './register.page.html',
  styleUrl: './auth-page.scss',
})
export class RegisterPage {
  protected readonly languageService = inject(LanguageService);
}
