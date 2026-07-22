import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { LanguageService } from '../../../../core/services/language.service';
import { ShadowingGateway } from '../../data-access/shadowing.gateway';
import { ShadowingHistoryItem } from '../../data-access/models/shadowing-history.model';

@Component({
  selector: 'app-history-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history-dropdown.component.html',
  styleUrl: './history-dropdown.component.scss',
})
export class HistoryDropdownComponent {
  protected readonly languageService = inject(LanguageService);
  private readonly gateway = inject(ShadowingGateway);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly items = signal<ShadowingHistoryItem[]>([]);
  private loaded = false;

  readonly videoSelected = output<ShadowingHistoryItem>();

  protected toggle(): void {
    const nextOpen = !this.open();
    this.open.set(nextOpen);

    if (nextOpen && !this.loaded) {
      this.loadHistory();
    }
  }

  protected selectItem(item: ShadowingHistoryItem): void {
    this.open.set(false);
    this.videoSelected.emit(item);
  }

  protected progressPercent(item: ShadowingHistoryItem): number {
    return (item.completedScenes / item.totalScenes) * 100;
  }

  private loadHistory(): void {
    this.isLoading.set(true);

    this.gateway.getHistory().subscribe((result) => {
      this.isLoading.set(false);

      if (result.isSuccess && result.value) {
        this.loaded = true;
        this.items.set(result.value.items);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
