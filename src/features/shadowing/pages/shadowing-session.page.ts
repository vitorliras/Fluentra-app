import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageSelectorComponent } from '../../../core/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { LanguageService } from '../../../core/services/language.service';
import { SessionService } from '../../../core/services/session.service';
import { ShellLayoutService } from '../../../core/services/shell-layout.service';
import { VideoSearchResult } from '../data-access/models/video-search-result.model';
import { HistoryDropdownComponent } from '../components/history-dropdown/history-dropdown.component';
import { VideoSearchBarComponent } from '../components/video-search-bar/video-search-bar.component';

interface PracticePhrase {
  text: string;
  phonetic: string;
  translation: string;
  done: boolean;
}

@Component({
  selector: 'app-shadowing-session-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoSearchBarComponent, ThemeToggleComponent, LanguageSelectorComponent, HistoryDropdownComponent],
  templateUrl: './shadowing-session.page.html',
  styleUrl: './shadowing-session.page.scss',
})
export class ShadowingSessionPage {
  protected readonly languageService = inject(LanguageService);
  protected readonly session = inject(SessionService);
  protected readonly shellLayout = inject(ShellLayoutService);

  protected readonly selectedVideo = signal<VideoSearchResult | null>(null);

  protected readonly phrases: PracticePhrase[] = [
    {
      text: 'Shadowing is not only for songs or movies, you can also use it for daily life English.',
      phonetic: '/ˈʃædəʊɪŋ/ /ɪz/ /nɒt/ /ˈəʊnli/ /fɔːr/ /sɒŋz/ /ɔːr/ /ˈmuːvɪz/',
      translation: 'Shadowing não é só para músicas ou filmes, você também pode usar para o inglês do dia a dia.',
      done: true,
    },
    {
      text: 'Choose simple phrases like "good morning," how are you?',
      phonetic: '/tʃuːz/ /ˈsɪmpl/ /freɪzɪz/ /laɪk/ /ɡʊd/ /ˈmɔːnɪŋ/ /haʊ/ /ɑːr/ /juː/',
      translation: 'Escolha frases simples como "bom dia", "como vai você?"',
      done: false,
    },
    {
      text: 'Or, "I\'d like a coffee, please." Listen and repeat at the same time.',
      phonetic: '/ɔːr/ /aɪd/ /laɪk/ /ə/ /ˈkɒfi/ /pliːz/ /ˈlɪsn/ /ənd/ /rɪˈpiːt/ /ət/ /ðə/ /seɪm/ /taɪm/',
      translation: 'Ou, "Eu gostaria de um café, por favor." Escute e repita ao mesmo tempo.',
      done: false,
    },
    {
      text: 'Practice when you wake up, go shopping, or meet friends.',
      phonetic: '/ˈpræktɪs/ /wen/ /juː/ /weɪk/ /ʌp/ /ɡəʊ/ /ˈʃɒpɪŋ/ /ɔːr/ /miːt/ /frendz/',
      translation: 'Pratique quando você acordar, for às compras ou encontrar amigos.',
      done: false,
    },
    {
      text: 'Daily life shadowing helps you use English naturally in real situations.',
      phonetic: '/ˈdeɪli/ /laɪf/ /ˈʃædəʊɪŋ/ /helps/ /juː/ /juːz/ /ˈɪŋɡlɪʃ/ /ˈnætʃrəli/ /ɪn/ /rɪəl/ /ˌsɪtʃuˈeɪʃnz/',
      translation: 'O shadowing do dia a dia ajuda você a usar o inglês naturalmente em situações reais.',
      done: false,
    },
    {
      text: 'With small steps every day, your speaking becomes stronger and more confident.',
      phonetic: '/wɪð/ /smɔːl/ /steps/ /ˈevri/ /deɪ/ /jɔːr/ /ˈspiːkɪŋ/ /bɪˈkʌmz/ /ˈstrɒŋɡər/ /ənd/ /mɔːr/ /ˈkɒnfɪdənt/',
      translation: 'Com pequenos passos todos os dias, sua fala fica mais forte e mais confiante.',
      done: false,
    },
  ];

  protected onVideoSelected(video: VideoSearchResult): void {
    this.selectedVideo.set(video);
  }

  protected translationLines(translation: string): string[] {
    return translation.split(/(?<=[.!?]"?)\s+(?=[A-ZÀ-ÖØ-Þ])/);
  }
}
