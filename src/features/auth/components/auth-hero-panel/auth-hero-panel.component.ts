import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../../../core/services/language.service';

// Painel de marca compartilhado pelas telas de Login e Cadastro — conteúdo fixo,
// sem @Input, porque é o mesmo nas duas telas (só o formulário à direita muda).
@Component({
  selector: 'app-auth-hero-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-hero-panel.component.html',
  styleUrl: './auth-hero-panel.component.scss',
})
export class AuthHeroPanelComponent {
  protected readonly languageService = inject(LanguageService);
}
