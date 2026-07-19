import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageSelectorComponent } from '../../../core/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { LanguageService } from '../../../core/services/language.service';
import { AuthHeroPanelComponent } from '../components/auth-hero-panel/auth-hero-panel.component';
import { LoginContainer } from '../containers/login.container';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthHeroPanelComponent, LoginContainer, ThemeToggleComponent, LanguageSelectorComponent],
  templateUrl: './login.page.html',
  styleUrl: './auth-page.scss',
})
export class LoginPage {
  protected readonly languageService = inject(LanguageService);
}
