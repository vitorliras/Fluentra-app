import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { LanguageService } from '../../../../core/services/language.service';

export interface HistoryEntry {
  youTubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  completedPhrases: number;
  totalPhrases: number;
}

const HISTORY_ENTRIES: HistoryEntry[] = [
  {
    youTubeVideoId: 'history-1',
    title: 'Shadowing for Daily Life',
    thumbnailUrl: '',
    completedPhrases: 1,
    totalPhrases: 6,
  },
  {
    youTubeVideoId: 'history-2',
    title: 'Everyday English Conversations for Beginners',
    thumbnailUrl: '',
    completedPhrases: 4,
    totalPhrases: 9,
  },
];

@Component({
  selector: 'app-history-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history-dropdown.component.html',
  styleUrl: './history-dropdown.component.scss',
})
export class HistoryDropdownComponent {
  protected readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly items = HISTORY_ENTRIES.filter((entry) => entry.completedPhrases > 0);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected progressPercent(item: HistoryEntry): number {
    return (item.completedPhrases / item.totalPhrases) * 100;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
