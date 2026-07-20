import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageSelectorComponent } from '../../../core/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { LanguageService } from '../../../core/services/language.service';
import { SessionService } from '../../../core/services/session.service';
import { VideoSearchBarComponent } from '../components/video-search-bar/video-search-bar.component';

interface PracticePhrase {
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-shadowing-session-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoSearchBarComponent, ThemeToggleComponent, LanguageSelectorComponent],
  templateUrl: './shadowing-session.page.html',
  styleUrl: './shadowing-session.page.scss',
})
export class ShadowingSessionPage {
  protected readonly languageService = inject(LanguageService);
  protected readonly session = inject(SessionService);

  // Conteúdo estático de exemplo — a sessão de prática de verdade (reprodução,
  // avaliação de pronúncia, avanço) ainda não tem backend implementado.
  protected readonly phrases: PracticePhrase[] = [
    { text: 'Shadowing is not only for songs or movies, you can also use it for daily life English.', done: true },
    { text: 'Choose simple phrases like "good morning," how are you?', done: false },
    { text: 'Or, "I\'d like a coffee, please." Listen and repeat at the same time.', done: false },
    { text: 'Practice when you wake up, go shopping, or meet friends.', done: false },
    { text: 'Daily life shadowing helps you use English naturally in real situations.', done: false },
    { text: 'With small steps every day, your speaking becomes stronger and more confident.', done: false },
  ];
}
