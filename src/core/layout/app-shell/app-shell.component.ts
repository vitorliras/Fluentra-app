import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LanguageService } from '../../services/language.service';

interface ShellNavItem {
  key: string;
  labelKey: string;
  route: string | null;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly languageService = inject(LanguageService);

  protected readonly collapsed = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected readonly navItems: ShellNavItem[] = [
    { key: 'dashboard', labelKey: 'shell.nav.dashboard', route: null },
    { key: 'shadowing', labelKey: 'shell.nav.shadowing', route: '/shadowing' },
    { key: 'vocabulary', labelKey: 'shell.nav.vocabulary', route: null },
    { key: 'ipa', labelKey: 'shell.nav.ipaPractice', route: null },
    { key: 'vocabGame', labelKey: 'shell.nav.vocabGame', route: null },
    { key: 'progress', labelKey: 'shell.nav.progress', route: null },
    { key: 'settings', labelKey: 'shell.nav.settings', route: null },
  ];
}
