import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { LanguageService, SUPPORTED_LANGUAGES, type Language } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
})
export class LanguageSelectorComponent {
  protected readonly languageService = inject(LanguageService);
  protected readonly languages = SUPPORTED_LANGUAGES;
  protected readonly isOpen = signal(false);

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected select(language: Language): void {
    this.languageService.setLanguage(language);
    this.isOpen.set(false);
  }

  protected shortCode(language: Language): string {
    return language.slice(0, 2).toUpperCase();
  }

  // Fecha o menu ao clicar fora — sem Angular CDK Overlay, só o suficiente para este caso.
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
