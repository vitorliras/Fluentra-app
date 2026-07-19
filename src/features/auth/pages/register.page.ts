import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { AuthHeroPanelComponent } from '../components/auth-hero-panel/auth-hero-panel.component';
import { RegisterContainer } from '../containers/register.container';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthHeroPanelComponent, RegisterContainer, ThemeToggleComponent],
  templateUrl: './register.page.html',
  styleUrl: './auth-page.scss',
})
export class RegisterPage {}
