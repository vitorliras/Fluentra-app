import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { AuthHeroPanelComponent } from '../components/auth-hero-panel/auth-hero-panel.component';
import { LoginContainer } from '../containers/login.container';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthHeroPanelComponent, LoginContainer, ThemeToggleComponent],
  templateUrl: './login.page.html',
  styleUrl: './auth-page.scss',
})
export class LoginPage {}
